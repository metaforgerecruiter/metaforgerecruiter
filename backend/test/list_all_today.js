const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const coll = mongoose.connection.db.collection('requirements');
  const today = new Date('2026-10-14T00:00:00Z');

  const todayReqs = await coll.find({
    createdAt: { $gte: today },
    deletedAt: null
  }).sort({ reqCode: -1, createdAt: -1 }).toArray();

  console.log(`Total active requirements created today: ${todayReqs.length}\n`);
  todayReqs.forEach((r, i) => {
    console.log(`${i+1}. [${r.reqCode}] ID: ${r._id} | Title: "${r.title}" | Client: "${r.clientName}" | JD ID: "${r.sourceClientJdId || ''}"`);
  });

  await mongoose.disconnect();
}
run();
