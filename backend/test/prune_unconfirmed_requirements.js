// After re-processing the mail window with the fixed pipeline, soft-delete mail requirements
// that no email in the window produced again (duplicates made from quoted replies, wrong merges).
// Also aligns clientName with the client record (e.g. "Ltts" vs "LTTS").
// Dry run by default. --apply writes a backup to ../backups first; --restore <file> undoes it.
// Usage (from backend/): node test/prune_unconfirmed_requirements.js --run-start <ISO> [--apply]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : undefined;
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');
  if (arg('--restore')) {
    const b = JSON.parse(fs.readFileSync(arg('--restore'), 'utf8'));
    const res = await reqs.updateMany({ _id: { $in: b.requirements.map((r) => new mongoose.Types.ObjectId(r._id)) } }, { $set: { deletedAt: null } });
    console.log(`restored ${res.modifiedCount}`);
    return mongoose.disconnect();
  }
  const runStart = new Date(arg('--run-start') || '');
  if (isNaN(runStart)) throw new Error('--run-start <ISO timestamp of the re-run> is required');

  const live = await reqs.find({ deletedAt: null }).toArray();
  const touched = new Set(
    (await db.collection('requirement_histories')
      .find({ createdAt: { $gte: runStart }, action: { $in: ['EMAIL_EXTRACT_UPDATE', 'EMAIL_EXTRACT_DEDUP', 'EMAIL_STATUS_UPDATE'] } })
      .project({ requirementId: 1 }).toArray()).map((h) => String(h.requirementId)),
  );
  const confirmed = (r) => touched.has(String(r._id)) || new Date(r.createdAt) >= runStart;
  // --also <reqCode,...>: known-corrupted records (e.g. wrong merges) removed even if a stale link
  // re-confirmed them; their mail identifiers are detached so the real emails can create them properly.
  const also = new Set(String(arg('--also') || '').split(',').map((s) => s.trim()).filter(Boolean));
  const stale = live.filter((r) => (r.sourceMessageId && !confirmed(r)) || also.has(r.reqCode));
  console.log(`live: ${live.length}; confirmed by the re-run: ${live.filter(confirmed).length}; not produced by any email: ${stale.length}`);
  stale.forEach((r) => console.log(`  remove ${r.reqCode} | ${r.clientName} | ${r.title} | ${r.status}`));

  const clients = new Map((await db.collection('clients').find({}).toArray()).map((c) => [String(c._id), c.clientName]));
  // Only align to a real client name (some client records are named after an email address).
  const renames = live.filter((r) => {
    const canonical = clients.get(String(r.clientId));
    return canonical && !canonical.includes('@') && canonical !== r.clientName && !stale.includes(r);
  });
  console.log(`clientName to align with client record: ${renames.length}${renames.length ? ` (${[...new Set(renames.map((r) => `${r.clientName}→${clients.get(String(r.clientId))}`))].join(', ')})` : ''}`);

  if (process.argv.includes('--apply')) {
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const file = path.join(backupDir, `unconfirmed_requirements_removed_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ requirements: stale, renamed: renames.map((r) => ({ _id: r._id, clientName: r.clientName })) }, null, 2));
    const now = new Date();
    if (stale.length) {
      await reqs.updateMany({ _id: { $in: stale.map((r) => r._id) } }, { $set: { deletedAt: now } });
      const detach = stale.filter((r) => also.has(r.reqCode)).map((r) => r._id);
      if (detach.length) {
        await reqs.updateMany({ _id: { $in: detach } }, { $unset: { idempotencyKey: '', sourceMessageId: '', conversationId: '', inReplyTo: '' } });
      }
      await db.collection('requirement_histories').insertMany(stale.map((r) => ({
        orgId: r.orgId, requirementId: r._id, action: 'SOFT_DELETE', newValue: { deletedAt: now },
        reason: 'Cleanup: not produced by any client email when the mail window was re-processed with the fixed pipeline',
        schemaVersion: 1, createdAt: now, updatedAt: now,
      })));
    }
    for (const r of renames) await reqs.updateOne({ _id: r._id }, { $set: { clientName: clients.get(String(r.clientId)) } });
    console.log(`backup: ${file}\nsoft-deleted ${stale.length}; renamed ${renames.length}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
