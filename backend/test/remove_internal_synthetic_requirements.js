// Soft-deletes requirements that came from internal senders, bounce notices or synthetic tests
// (same selection as test/audit_requirement_integrity.js). Reversible: sets deletedAt only,
// writes a full JSON backup first and a SOFT_DELETE history entry per record.
// Usage (from backend/): node test/remove_internal_synthetic_requirements.js [--apply]
// Restore: node test/remove_internal_synthetic_requirements.js --restore <backup.json>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const isInternalOrSynthetic = (r) =>
  /metaforge|internal|test client|mock/i.test(r.clientName || '') || /V1-JD-/.test(r.reqCode || '');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');

  const restoreIdx = process.argv.indexOf('--restore');
  if (restoreIdx > -1) {
    const backup = JSON.parse(fs.readFileSync(process.argv[restoreIdx + 1], 'utf8'));
    const ids = backup.requirements.map((r) => new mongoose.Types.ObjectId(r._id));
    const res = await reqs.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: null } });
    console.log(`restored ${res.modifiedCount} requirement(s)`);
    return mongoose.disconnect();
  }

  const apply = process.argv.includes('--apply');
  const targets = (await reqs.find({ deletedAt: null }).toArray()).filter(isInternalOrSynthetic);
  const ids = targets.map((r) => r._id);
  const linkCount = async (coll) => {
    const rows = await db.collection(coll).aggregate([
      { $match: { requirementId: { $in: ids } } },
      { $group: { _id: '$requirementId', n: { $sum: 1 } } },
    ]).toArray();
    return new Map(rows.map((x) => [String(x._id), x.n]));
  };
  const subs = await linkCount('submissions');
  const ivs = await linkCount('interviews');

  targets
    .sort((a, b) => String(a.reqCode).localeCompare(String(b.reqCode)))
    .forEach((r, i) => {
      const s = subs.get(String(r._id)) || 0;
      const v = ivs.get(String(r._id)) || 0;
      console.log(`${String(i + 1).padStart(2)}. ${r.reqCode} | ${r.clientName} | ${String(r.title || '').slice(0, 70)} | status=${r.status}` +
        (s || v ? ` | LINKED: ${s} submission(s), ${v} interview(s)` : ''));
    });
  console.log(`\n${targets.length} record(s) selected; ${[...subs.values()].reduce((a, b) => a + b, 0)} linked submission(s), ${[...ivs.values()].reduce((a, b) => a + b, 0)} linked interview(s)`);

  // --skip-linked keeps records that recruiters have already worked on (submissions/interviews).
  if (process.argv.includes('--skip-linked')) {
    const linked = (r) => subs.has(String(r._id)) || ivs.has(String(r._id));
    const kept = targets.filter(linked);
    targets.splice(0, targets.length, ...targets.filter((r) => !linked(r)));
    ids.splice(0, ids.length, ...targets.map((r) => r._id));
    console.log(`--skip-linked: keeping ${kept.length} record(s) with submissions/interviews: ${kept.map((r) => r.reqCode).join(', ')}`);
    console.log(`will remove ${targets.length} record(s)`);
  }

  if (apply && targets.length) {
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `internal_synthetic_requirements_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ requirements: targets }, null, 2));
    const now = new Date();
    const res = await reqs.updateMany({ _id: { $in: ids }, deletedAt: null }, { $set: { deletedAt: now } });
    const performedBy = (await db.collection('users').findOne({ role: 'superadmin', deletedAt: null }))?._id || null;
    await db.collection('requirement_histories').insertMany(targets.map((r) => ({
      orgId: r.orgId,
      requirementId: r._id,
      action: 'SOFT_DELETE',
      newValue: { deletedAt: now },
      performedBy,
      reason: 'Removed: created from internal sender / bounce notice / synthetic test data (mail-extraction cleanup)',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    })));
    console.log(`backup: ${backupFile}`);
    console.log(`soft-deleted ${res.modifiedCount} requirement(s)`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
