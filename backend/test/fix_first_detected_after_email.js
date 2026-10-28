// A requirement cannot be first detected after the client email that created it. Restores
// firstDetectedAt = emailArrivedTime where an older code path overwrote it with a later
// processing time. Dry run by default; --apply writes a backup to ../backups first.
// Usage (from backend/): node test/fix_first_detected_after_email.js [--apply]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const reqs = mongoose.connection.db.collection('requirements');
  const rows = (await reqs.find({ deletedAt: null, sourceMessageId: { $ne: null }, emailArrivedTime: { $ne: null } }).toArray())
    .filter((r) => r.firstDetectedAt && new Date(r.firstDetectedAt) > new Date(r.emailArrivedTime));
  console.log(`requirements first detected after their own email: ${rows.length}`);
  rows.slice(0, 10).forEach((r) => console.log(`  ${r.reqCode} first=${r.firstDetectedAt.toISOString()} email=${r.emailArrivedTime.toISOString()}`));
  if (process.argv.includes('--apply') && rows.length) {
    const dir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `first_detected_after_email_fix_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(rows.map((r) => ({ _id: r._id, reqCode: r.reqCode, firstDetectedAt: r.firstDetectedAt })), null, 2));
    const res = await reqs.bulkWrite(rows.map((r) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { firstDetectedAt: r.emailArrivedTime } } } })));
    console.log(`backup: ${file}\nfixed ${res.modifiedCount}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
