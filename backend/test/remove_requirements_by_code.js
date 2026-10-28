// Soft-delete specific requirements by Requirement ID (reqCode), with a backup and history entry.
// Dry run by default. Usage (from backend/):
//   node test/remove_requirements_by_code.js --codes 2026-10-13-009,2026-10-14-021 --reason "duplicate" [--apply]
//   node test/remove_requirements_by_code.js --client-ids 205157-1 --reason "..." [--apply]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : '';
};
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');
  const rows = await reqs.find({
    deletedAt: null,
    $or: [{ reqCode: { $in: list(arg('--codes')) } }, { sourceClientJdId: { $in: list(arg('--client-ids')) } }],
  }).toArray();
  rows.forEach((r) => console.log(`remove ${r.reqCode}${r.sourceClientJdId ? ` (${r.sourceClientJdId})` : ''} | ${r.clientName} | ${r.title}`));
  if (process.argv.includes('--apply') && rows.length) {
    const dir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `removed_requirements_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ requirements: rows }, null, 2));
    const now = new Date();
    await reqs.updateMany({ _id: { $in: rows.map((r) => r._id) } }, { $set: { deletedAt: now } });
    await db.collection('requirement_histories').insertMany(rows.map((r) => ({
      orgId: r.orgId, requirementId: r._id, action: 'SOFT_DELETE', newValue: { deletedAt: now },
      reason: arg('--reason') || 'Removed during data correction', schemaVersion: 1, createdAt: now, updatedAt: now,
    })));
    console.log(`backup: ${file}\nremoved ${rows.length}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
