// Fills the missing firstDetectedAt (original creation time) on requirements created before
// the field existed, so newest-first ordering is consistent in queries, API and UI.
// Additive only: never overwrites an existing value, never changes reqCode or other fields.
// Usage (from backend/): node test/backfill_first_detected_at.js [--apply] [--db <name>]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

(async () => {
  const apply = process.argv.includes('--apply');
  const dbIdx = process.argv.indexOf('--db');
  const dbName = dbIdx > -1 ? process.argv[dbIdx + 1] : process.env.MONGODB_DB_NAME;
  await mongoose.connect(process.env.MONGODB_URI, { dbName });
  const col = mongoose.connection.db.collection('requirements');
  const missing = await col
    .find({ $or: [{ firstDetectedAt: null }, { firstDetectedAt: { $exists: false } }] })
    .project({ _id: 1, reqCode: 1, emailArrivedTime: 1, createdAt: 1 })
    .toArray();
  const updates = missing
    .map((r) => ({ _id: r._id, reqCode: r.reqCode, at: r.emailArrivedTime || r.createdAt || r._id.getTimestamp() }))
    .filter((u) => u.at);
  console.log(`[${dbName}] requirements missing firstDetectedAt: ${missing.length}; fillable: ${updates.length}`);
  if (apply && updates.length) {
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `first_detected_at_backfill_${dbName}_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(missing, null, 2));
    console.log(`backup of affected ids/timestamps: ${backupFile}`);
    const res = await col.bulkWrite(
      updates.map((u) => ({
        updateOne: {
          filter: { _id: u._id, $or: [{ firstDetectedAt: null }, { firstDetectedAt: { $exists: false } }] },
          update: { $set: { firstDetectedAt: new Date(u.at) } },
        },
      })),
    );
    console.log(`filled firstDetectedAt on ${res.modifiedCount} requirement(s)`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
