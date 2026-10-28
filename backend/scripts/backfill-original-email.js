/*
 * One-off backfill: copy the original client mail into requirements ingested before the
 * backend stored it (sourceEmailBody / sourceEmailHtml were added later).
 *
 * Source: the mail pipeline's local SQLite history (opened read-only). Payloads in
 * jd_versions, client_requirements and requirement_memory carry graphMessageId, bodyHtml,
 * bodyText and subject. Merged payloads move graphMessageId and bodyHtml together, but
 * bodyText can be replaced by the extracted JD on updates, so per message we take the
 * earliest bodyText that differs from that row's job_description.
 *
 * Match order per requirement: sourceMessageId -> sourceClientJdId -> conversationId.
 * A jd id / conversation that maps to more than one mail is ambiguous and skipped, unless
 * the requirement's conversationId narrows it to exactly one.
 *
 * Only requirements with BOTH sourceEmailBody and sourceEmailHtml null/missing are touched;
 * sourceSubject is set only when empty. Nothing is ever overwritten.
 *
 * Usage (from backend/):
 *   node scripts/backfill-original-email.js            # dry run (default), no writes
 *   node scripts/backfill-original-email.js --apply    # write to MONGODB_DB_NAME
 *   --sqlite <path>  override the SQLite store (default: pipeline data/processed_messages.db)
 *   --verbose        list every requirement with its outcome
 */
require('dotenv').config();
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { MongoClient } = require('mongodb');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const VERBOSE = args.includes('--verbose');
const sqliteArg = args.indexOf('--sqlite');
const SQLITE_PATH = sqliteArg >= 0
  ? path.resolve(args[sqliteArg + 1])
  : path.resolve(__dirname, '../../Mail extraction/devloper/devloper/data/processed_messages.db');

if (/backup/i.test(path.basename(SQLITE_PATH))) {
  console.error('Refusing to read a backup .db file:', SQLITE_PATH);
  process.exit(1);
}

const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
const jdKey = (v) => str(v).toLowerCase();

function loadMessages() {
  const db = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  const rows = [];
  for (const table of ['jd_versions', 'client_requirements', 'requirement_memory']) {
    for (const r of db.prepare(`SELECT payload_json, created_at FROM ${table}`).all()) {
      let p;
      try { p = JSON.parse(r.payload_json); } catch { continue; }
      if (str(p.graphMessageId)) rows.push({ createdAt: str(r.created_at), p });
    }
  }
  db.close();
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const byMsg = new Map(); // graphMessageId -> { html, text, subject, jdIds:Set, convIds:Set }
  for (const { p } of rows) {
    const id = str(p.graphMessageId);
    let m = byMsg.get(id);
    if (!m) byMsg.set(id, (m = { id, html: null, text: null, subject: null, jdIds: new Set(), convIds: new Set() }));
    if (!m.html && str(p.bodyHtml)) m.html = p.bodyHtml;
    if (!m.text && str(p.bodyText) && str(p.bodyText) !== str(p.job_description)) m.text = p.bodyText;
    if (!m.subject && str(p.subject)) m.subject = str(p.subject);
    if (str(p.client_jd_id)) m.jdIds.add(jdKey(p.client_jd_id));
    const prov = p._provenance && typeof p._provenance === 'object' ? p._provenance : {};
    for (const c of [prov.conversation_id, p.conversation_id, p.conversationId]) if (str(c)) m.convIds.add(str(c));
  }

  const byJd = new Map();
  const byConv = new Map();
  const add = (map, k, id) => { if (!map.has(k)) map.set(k, new Set()); map.get(k).add(id); };
  for (const m of byMsg.values()) {
    if (!m.html && !m.text) continue;
    for (const j of m.jdIds) add(byJd, j, m.id);
    for (const c of m.convIds) add(byConv, c, m.id);
  }
  return { byMsg, byJd, byConv };
}

function resolve(req, idx) {
  const msgId = str(req.sourceMessageId);
  const conv = str(req.conversationId);
  const usable = (id) => { const m = idx.byMsg.get(id); return m && (m.html || m.text) ? m : null; };

  if (msgId && usable(msgId)) return { outcome: 'matched', via: 'sourceMessageId', msg: usable(msgId) };

  const jd = jdKey(req.sourceClientJdId);
  if (jd && idx.byJd.has(jd)) {
    let ids = [...idx.byJd.get(jd)];
    if (ids.length > 1 && conv) {
      const narrowed = ids.filter((id) => idx.byMsg.get(id).convIds.has(conv));
      if (narrowed.length === 1) ids = narrowed;
    }
    if (ids.length === 1) return { outcome: 'matched', via: 'sourceClientJdId', msg: usable(ids[0]) };
    return { outcome: 'ambiguous', via: 'sourceClientJdId', candidates: ids.length };
  }

  if (conv && idx.byConv.has(conv)) {
    const ids = [...idx.byConv.get(conv)];
    if (ids.length === 1) return { outcome: 'matched', via: 'conversationId', msg: usable(ids[0]) };
    return { outcome: 'ambiguous', via: 'conversationId', candidates: ids.length };
  }
  return { outcome: 'unmatched' };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) throw new Error('MONGODB_URI / MONGODB_DB_NAME not set');

  const idx = loadMessages();
  console.log(`SQLite: ${SQLITE_PATH}`);
  console.log(`  mails with stored body: ${[...idx.byMsg.values()].filter((m) => m.html || m.text).length}`);

  const client = await MongoClient.connect(uri);
  try {
    const col = client.db(dbName).collection('requirements');
    const total = await col.countDocuments({});
    const missingFilter = { sourceEmailBody: null, sourceEmailHtml: null };
    const reqs = await col
      .find(missingFilter, { projection: { reqCode: 1, title: 1, sourceMessageId: 1, sourceClientJdId: 1, conversationId: 1, sourceSubject: 1, deletedAt: 1 } })
      .toArray();
    console.log(`Mongo: ${dbName}.requirements  total=${total}  missing original mail=${reqs.length}`);
    console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}\n`);

    const counts = { matched: 0, unmatched: 0, ambiguous: 0, written: 0, raced: 0 };
    const via = {};
    let htmlOnly = 0;
    let subjectFilled = 0;
    for (const req of reqs) {
      const r = resolve(req, idx);
      counts[r.outcome]++;
      const label = `${req.reqCode || req._id} ${str(req.title).slice(0, 50)}${req.deletedAt ? ' [deleted]' : ''}`;
      if (r.outcome !== 'matched') {
        if (VERBOSE || r.outcome === 'ambiguous') {
          console.log(`  ${r.outcome.toUpperCase()}${r.via ? ` (${r.via}, ${r.candidates} mails)` : ''}: ${label}`);
        }
        continue;
      }
      via[r.via] = (via[r.via] || 0) + 1;
      if (!r.msg.text) htmlOnly++;
      const set = { sourceEmailBody: r.msg.text || null, sourceEmailHtml: r.msg.html || null };
      if (!str(req.sourceSubject) && r.msg.subject) { set.sourceSubject = r.msg.subject; subjectFilled++; }
      if (VERBOSE) console.log(`  MATCHED (${r.via}): ${label}`);
      if (APPLY) {
        const res = await col.updateOne({ _id: req._id, ...missingFilter }, { $set: set });
        if (res.modifiedCount === 1) counts.written++; else counts.raced++;
      }
    }

    console.log('\nSummary');
    console.log(`  matched:   ${counts.matched}  (${Object.entries(via).map(([k, v]) => `${k}=${v}`).join(', ') || '-'})`);
    console.log(`    of which html only (no clean plain text): ${htmlOnly}`);
    console.log(`    sourceSubject filled where empty: ${subjectFilled}`);
    console.log(`  ambiguous: ${counts.ambiguous}`);
    console.log(`  unmatched: ${counts.unmatched}`);
    console.log('  sourceFromName: not available in pipeline payloads (left unchanged)');
    if (APPLY) console.log(`  written:   ${counts.written}  (skipped, filled concurrently: ${counts.raced})`);
  } finally {
    await client.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
