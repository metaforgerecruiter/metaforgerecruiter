// Restore specific soft-deleted requirements (by client requirement ID or exact title+client) and give
// each the next free YYYY-MM-DD-NNN for its original creation day (existing IDs are not touched).
// Dry run by default; --apply writes a backup and RESTORE history entries.
// Usage (from backend/): node test/restore_requirements.js --ids 203486-1,203495-1 --titles "LTTS|CAD PLM Process Lead" [--apply]
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : '';
};
const day = (d) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');
  const targets = [];
  for (const id of arg('--ids').split(',').map((s) => s.trim()).filter(Boolean)) {
    const live = await reqs.findOne({ sourceClientJdId: id, deletedAt: null });
    if (live) { console.log(`${id}: already live as ${live.reqCode}`); continue; }
    const doc = await reqs.find({ sourceClientJdId: id, deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).limit(1).next();
    if (doc) targets.push(doc); else console.log(`${id}: no deleted record found`);
  }
  for (const spec of arg('--titles').split(';').map((s) => s.trim()).filter(Boolean)) {
    const [client, title] = spec.split('|');
    const doc = await reqs.find({ clientName: new RegExp(`^${client}$`, 'i'), title, deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).limit(1).next();
    if (doc) targets.push(doc); else console.log(`${spec}: no deleted record found`);
  }

  const plan = [];
  const next = {};
  for (const r of targets) {
    const d = day(new Date(r.firstDetectedAt || r.emailArrivedTime || r.createdAt));
    if (next[d] === undefined) {
      const used = await reqs.find({ reqCode: { $regex: `^${d}-\\d{3,}$` } }).project({ reqCode: 1 }).toArray();
      next[d] = used.reduce((mx, u) => Math.max(mx, parseInt(u.reqCode.slice(11), 10) || 0), 0);
    }
    next[d] += 1;
    plan.push({ _id: r._id, orgId: r.orgId, oldCode: r.reqCode, code: `${d}-${String(next[d]).padStart(3, '0')}`, title: r.title, client: r.sourceClientJdId, deletedAt: r.deletedAt });
  }
  plan.forEach((p) => console.log(`restore ${p.oldCode} -> ${p.code}${p.client ? ` (${p.client})` : ''} | ${p.title}`));

  if (process.argv.includes('--apply') && plan.length) {
    const dir = path.resolve(__dirname, '..', '..', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `restored_requirements_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(plan, null, 2));
    const now = new Date();
    for (const p of plan) {
      await reqs.updateOne({ _id: p._id }, { $set: { deletedAt: null, reqCode: p.code, lastUpdatedAt: now } });
    }
    await db.collection('requirement_histories').insertMany(plan.map((p) => ({
      orgId: p.orgId, requirementId: p._id, action: 'RESTORE', oldValue: { reqCode: p.oldCode, deletedAt: p.deletedAt },
      newValue: { reqCode: p.code, deletedAt: null }, reason: 'Restored: genuine client requirement confirmed missing',
      schemaVersion: 1, createdAt: now, updatedAt: now,
    })));
    console.log(`backup: ${file}\nrestored ${plan.length}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
