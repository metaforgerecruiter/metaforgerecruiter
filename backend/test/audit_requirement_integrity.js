// Read-only integrity audit of live requirements (changes nothing).
// Usage (from backend/): node test/audit_requirement_integrity.js
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');
  const hist = db.collection('requirement_histories');
  const live = await reqs.find({ deletedAt: null }).toArray();
  const out = (title, rows) => {
    console.log(`\n## ${title}: ${rows.length}`);
    rows.slice(0, 25).forEach((r) => console.log(`  ${r}`));
  };

  out('Live requirements', []);
  console.log(`  total=${live.length} fromMail=${live.filter((r) => r.sourceMessageId).length}`);

  out('Missing firstDetectedAt (ordering falls back to createdAt)', live.filter((r) => !r.firstDetectedAt).map((r) => r.reqCode));

  out('Internal / synthetic client records', live
    .filter((r) => /metaforge|internal|test client|mock/i.test(r.clientName || '') || /V1-JD-/.test(r.reqCode || ''))
    .map((r) => `${r.reqCode} | ${r.clientName} | ${r.title}`));

  // Records updated by mail from more than one distinct source subject (possible wrong merges).
  const mailUpdates = await hist.aggregate([
    { $match: { action: { $in: ['EMAIL_EXTRACT_UPDATE', 'EMAIL_EXTRACT_DEDUP'] } } },
    { $group: { _id: '$requirementId', reasons: { $addToSet: '$reason' }, n: { $sum: 1 } } },
  ]).toArray();
  const byId = new Map(live.map((r) => [String(r._id), r]));
  const merged = [];
  for (const m of mailUpdates) {
    const r = byId.get(String(m._id));
    if (!r || r.sourceClientJdId) continue; // client-ID matches are trustworthy
    const titleChanges = await hist.find({ requirementId: m._id, 'newValue.title': { $exists: true } }).project({ 'newValue.title': 1 }).toArray();
    const titles = new Set(titleChanges.map((h) => h.newValue.title));
    if (titles.size > 0) merged.push(`${r.reqCode} | ${r.clientName} | now "${r.title}" | source subject "${r.sourceSubject}" | titles written by mail: ${[...titles].join(' / ')}`);
  }
  out('Mail updates that changed the title of a record without a client ID (possible wrong merges)', merged);

  // Same client + same normalized title created from different emails (possible duplicates).
  const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const groups = new Map();
  for (const r of live.filter((x) => x.sourceMessageId && !x.sourceClientJdId)) {
    const k = `${String(r.clientId)}|${norm(r.title)}`;
    groups.set(k, [...(groups.get(k) || []), r]);
  }
  out('Same client + same title, no client ID, several records (check: duplicates or genuinely separate)', [...groups.values()]
    .filter((g) => g.length > 1)
    .map((g) => g.map((r) => `${r.reqCode} (${r.location})`).join('  ||  ') + `  — ${g[0].clientName}: ${g[0].title}`));

  out('Legacy-format Requirement IDs (kept unchanged; new records use YYYY-MM-DD-NNN)', [
    `${live.filter((r) => /^\d{4}\/\d{2}\/\d{2}-/.test(r.reqCode || '')).length} with YYYY/MM/DD-NNN, ` +
      `${live.filter((r) => /\(.+\)$/.test(r.reqCode || '')).length} with "(client id)" suffix, ` +
      `${live.filter((r) => /^REQ-/.test(r.reqCode || '')).length} with REQ- prefix, ` +
      `${live.filter((r) => /^\d{4}-\d{2}-\d{2}-\d{3,}$/.test(r.reqCode || '')).length} already YYYY-MM-DD-NNN`,
  ]);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
