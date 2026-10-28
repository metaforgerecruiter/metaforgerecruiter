const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements').find({
    $or: [
      { sourceClientJdId: { $in: ['188693-1', '188603-1', '188693', '188603'] } },
      { title: { $regex: 'ServiceNow', $options: 'i' } },
      { description: { $regex: '188693|188603', $options: 'i' } }
    ]
  }).toArray();
  console.log('Found requirements in Mongo:', reqs.length);
  reqs.forEach(r => {
    console.log('--- REQ ---');
    console.log('reqCode:', r.reqCode);
    console.log('sourceClientJdId:', r.sourceClientJdId);
    console.log('title:', r.title);
    console.log('clientName:', r.clientName);
    console.log('status:', r.status);
    console.log('deletedAt:', r.deletedAt);
    console.log('idempotencyKey:', r.idempotencyKey);
    console.log('inReplyTo:', r.inReplyTo);
    console.log('createdAt:', r.createdAt);
    console.log('description preview:', (r.description || '').substring(0, 300));
  });
  await mongoose.disconnect();
}
run();
