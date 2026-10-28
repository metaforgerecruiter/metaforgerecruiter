// One-off repair: Accenture rows whose location was overwritten with the skill name by the
// shifted-column extraction run on 2026-10-15, where the source table says "PAN India"
// (the pipeline drops PAN India as non-specific, so the corrected re-run could not overwrite it).
// Usage (from backend/): node test/fix_pan_india_locations.js [--apply]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const CLIENT_JD_IDS = ['198381-1', '204241-1'];

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const col = mongoose.connection.db.collection('requirements');
  const rows = await col.find({ sourceClientJdId: { $in: CLIENT_JD_IDS }, deletedAt: null }).toArray();
  const fixes = [];
  for (const r of rows) {
    // The description holds the email body, including this requirement's table row.
    const line = String(r.description || '')
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(r.sourceClientJdId));
    const cells = line ? line.split('|').map((c) => c.trim()) : [];
    const tableLocation = cells[3] || '';
    console.log(`${r.reqCode} | title=${r.title} | location=${r.location} | table row location=${JSON.stringify(tableLocation)}`);
    if (tableLocation && r.location === r.title) fixes.push({ _id: r._id, location: tableLocation });
  }
  if (apply && fixes.length) {
    const backupDir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `pan_india_location_fix_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2));
    console.log(`backup written: ${backupFile}`);
    for (const f of fixes) {
      await col.updateOne({ _id: f._id }, { $set: { location: f.location, lastUpdatedAt: new Date() } });
    }
    console.log(`updated ${fixes.length} row(s)`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
