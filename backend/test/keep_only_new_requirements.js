// Keep only requirements extracted from client mail since a cutoff; soft-delete everything else.
// Dry run by default (changes nothing). --apply writes a full JSON backup to ../backups first,
// then sets deletedAt on the removed records and adds a SOFT_DELETE history entry for each.
//
// Usage (from backend/):
//   node test/keep_only_new_requirements.js [--since 2026-10-12T18:30:00Z] [--apply]
//   node test/keep_only_new_requirements.js --restore <backup.json>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const INTERNAL = /metaforge|internal|test client|mock/i;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');

  if (process.argv.includes('--restore')) {
    const backup = JSON.parse(fs.readFileSync(arg('--restore'), 'utf8'));
    const ids = backup.requirements.map((r) => new mongoose.Types.ObjectId(r._id));
    const res = await reqs.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: null } });
    console.log(`restored ${res.modifiedCount} requirement(s)`);
    return mongoose.disconnect();
  }

  // Default cutoff: start of the 2-day mail window (13 Oct 2026 00:00 IST).
  const since = new Date(arg('--since', '2026-10-12T18:30:00Z'));
  const live = await reqs.find({ deletedAt: null }).toArray();
  const isNewMail = (r) =>
    Boolean(r.sourceMessageId) &&
    !INTERNAL.test(r.clientName || '') &&
    !/V1-JD-/.test(r.reqCode || '') &&
    new Date(r.firstDetectedAt || r.emailArrivedTime || 0) >= since;
  const keep = live.filter(isNewMail);
  const remove = live.filter((r) => !isNewMail(r));
  const removeIds = remove.map((r) => r._id);

  const count = async (coll) => db.collection(coll).countDocuments({ requirementId: { $in: removeIds }, deletedAt: null });
  const [subs, ivs, offers] = await Promise.all([count('submissions'), count('interviews'), count('offers')]);
  const byClient = (rows) => Object.entries(rows.reduce((a, r) => ((a[r.clientName] = (a[r.clientName] || 0) + 1), a), {}))
    .sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}: ${n}`).join(', ');

  console.log(`cutoff (firstDetectedAt >=): ${since.toISOString()}`);
  console.log(`live requirements: ${live.length}`);
  console.log(`KEEP   ${keep.length} — client mail since cutoff — ${byClient(keep)}`);
  console.log(`REMOVE ${remove.length} — ${byClient(remove).slice(0, 400)}`);
  console.log(`  of which from mail before cutoff: ${remove.filter((r) => r.sourceMessageId).length}; manual/imported: ${remove.filter((r) => !r.sourceMessageId).length}`);
  console.log(`  oldest/newest removed: ${remove.map((r) => r.reqCode).sort()[0]} .. ${remove.map((r) => r.reqCode).sort().slice(-1)[0]}`);
  console.log(`  activity attached to removed records: ${subs} submission(s), ${ivs} interview(s), ${offers} offer(s) (left untouched)`);

  if (process.argv.includes('--apply') && remove.length) {
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `old_requirements_removed_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ cutoff: since, requirements: remove }, null, 2));
    const now = new Date();
    const res = await reqs.updateMany({ _id: { $in: removeIds }, deletedAt: null }, { $set: { deletedAt: now } });
    const performedBy = (await db.collection('users').findOne({ role: 'superadmin', deletedAt: null }))?._id || null;
    await db.collection('requirement_histories').insertMany(remove.map((r) => ({
      orgId: r.orgId, requirementId: r._id, action: 'SOFT_DELETE', newValue: { deletedAt: now }, performedBy,
      reason: `Cleanup: keep only client-mail requirements since ${since.toISOString()}`,
      schemaVersion: 1, createdAt: now, updatedAt: now,
    })));
    console.log(`backup: ${backupFile}`);
    console.log(`soft-deleted ${res.modifiedCount} requirement(s); restore with --restore <backup>`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
