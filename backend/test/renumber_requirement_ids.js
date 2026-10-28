// Renumber live requirements to YYYY-MM-DD-NNN from the start: the day is the original creation
// (client email) date in Asia/Kolkata, NNN restarts at 001 each day, ordered by firstDetectedAt
// then _id. The client's reference stays in sourceClientJdId (shown in brackets by the API/UI).
// Dry run by default. --apply writes a backup + REQ_ID_RENUMBER history; --restore <file> undoes it.
// Usage (from backend/): node test/renumber_requirement_ids.js [--apply | --restore <backup.json>]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const day = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

async function setCodes(reqs, pairs) {
  // Two phases so a code is never held by two live rows at the same moment (unique index).
  await reqs.bulkWrite(pairs.map((p) => ({ updateOne: { filter: { _id: p._id }, update: { $set: { reqCode: `TMP-${p._id}` } } } })));
  await reqs.bulkWrite(pairs.map((p) => ({ updateOne: { filter: { _id: p._id }, update: { $set: { reqCode: p.code } } } })));
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');
  const ri = process.argv.indexOf('--restore');
  if (ri > -1) {
    const b = JSON.parse(fs.readFileSync(process.argv[ri + 1], 'utf8'));
    await setCodes(reqs, b.map((x) => ({ _id: new mongoose.Types.ObjectId(x._id), code: x.oldCode })));
    console.log(`restored ${b.length} Requirement ID(s)`);
    return mongoose.disconnect();
  }

  const live = await reqs.find({ deletedAt: null }).sort({ firstDetectedAt: 1, _id: 1 }).toArray();
  const seq = {};
  const plan = live.map((r) => {
    const d = day(new Date(r.firstDetectedAt || r.emailArrivedTime || r.createdAt));
    seq[d] = (seq[d] || 0) + 1;
    return { _id: r._id, orgId: r.orgId, oldCode: r.reqCode, code: `${d}-${String(seq[d]).padStart(3, '0')}`, client: r.sourceClientJdId || '', title: r.title };
  });
  const clash = await reqs.countDocuments({ deletedAt: { $ne: null }, reqCode: { $in: plan.map((p) => p.code) } });
  console.log(`live requirements: ${plan.length}; per day: ${JSON.stringify(seq)}; codes already used by deleted rows: ${clash}`);
  plan.forEach((p) => console.log(`  ${p.oldCode.padEnd(28)} -> ${p.code}${p.client ? ` (${p.client})` : ''} | ${p.title}`));

  if (process.argv.includes('--apply')) {
    if (clash) throw new Error('a new code is already used by a deleted row; aborting');
    const dir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `requirement_id_renumber_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(plan, null, 2));
    const changed = plan.filter((p) => p.oldCode !== p.code);
    await setCodes(reqs, changed);
    const now = new Date();
    if (changed.length) {
      await db.collection('requirement_histories').insertMany(changed.map((p) => ({
        orgId: p.orgId, requirementId: p._id, action: 'REQ_ID_RENUMBER',
        oldValue: { reqCode: p.oldCode }, newValue: { reqCode: p.code },
        reason: 'Requirement ID renumbered to YYYY-MM-DD-NNN (client email date, IST)', schemaVersion: 1, createdAt: now, updatedAt: now,
      })));
    }
    console.log(`backup: ${file}\nrenumbered ${changed.length} requirement(s)`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
