// One-off cleanup: requirements created on 2026-10-15 by a mail-extraction run whose
// table parser shifted Accenture columns (title = grade "9", location = skill name).
// Usage (from backend/): node test/fix_misaligned_accenture_rows.js [--apply]
// Without --apply it only lists the rows. With --apply it writes a JSON backup to
// ../backups/ and then removes the rows and their history entries.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const SOURCE_MESSAGE_IDS = [
  'AAMkADE3NDllMmZlLTU3NmUtNGI2MS1hZjA4LTEwNzAzZWZjYzUxOABGAAAAAABG8jimhHIeTrzzeDCLnQR9BwAIHnK_cnn0TIdFuplFGEzAAAAAAAEMAAAIHnK_cnn0TIdFuplFGEzAAACF0dQ6AAA=',
  'AAMkADE3NDllMmZlLTU3NmUtNGI2MS1hZjA4LTEwNzAzZWZjYzUxOABGAAAAAABG8jimhHIeTrzzeDCLnQR9BwAIHnK_cnn0TIdFuplFGEzAAAAAAAEMAAAIHnK_cnn0TIdFuplFGEzAAACF0dQ7AAA=',
];
const SINCE = new Date('2026-10-15T06:55:00Z');

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const filter = { sourceMessageId: { $in: SOURCE_MESSAGE_IDS }, createdAt: { $gte: SINCE } };
  const rows = await db.collection('requirements').find(filter).toArray();
  for (const r of rows) {
    console.log(`${r.reqCode} | title=${JSON.stringify(r.title)} | location=${JSON.stringify(String(r.location || '').slice(0, 50))}`);
  }
  console.log(`matched ${rows.length} requirement(s)`);
  if (apply && rows.length) {
    const ids = rows.map((r) => r._id);
    const histories = await db.collection('requirement_histories').find({ requirementId: { $in: ids } }).toArray();
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `misaligned_accenture_rows_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ requirements: rows, requirement_histories: histories }, null, 2));
    console.log(`backup written: ${backupFile}`);
    const h = await db.collection('requirement_histories').deleteMany({ requirementId: { $in: ids } });
    const d = await db.collection('requirements').deleteMany({ _id: { $in: ids } });
    console.log(`removed ${d.deletedCount} requirement(s), ${h.deletedCount} history entr(y/ies)`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
