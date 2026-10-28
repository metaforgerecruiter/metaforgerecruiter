const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements').find({
    reqCode: /^2026\/10\//,
    deletedAt: null
  }).sort({ reqCode: -1 }).toArray();

  console.log('Active 2026/10 reqs:', reqs.length);
  reqs.forEach(r => console.log(r.reqCode, '|', r.title, '|', r.clientName));
  await mongoose.disconnect();
}
run();
