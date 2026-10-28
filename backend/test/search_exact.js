const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements').find({
    $or: [
      { reqCode: { $regex: '188603' } },
      { sourceClientJdId: { $regex: '188603' } },
      { reqCode: { $regex: '188693' } },
      { sourceClientJdId: { $regex: '188693' } },
    ]
  }).toArray();
  console.log('Total matches in Mongo:', reqs.length);
  for (const r of reqs) {
    console.log({
      reqCode: r.reqCode,
      sourceClientJdId: r.sourceClientJdId,
      title: r.title,
      clientName: r.clientName,
      status: r.status,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt
    });
  }
  await mongoose.disconnect();
}
run();
