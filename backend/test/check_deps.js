const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const coll = mongoose.connection.db.collection('requirements');
  const subColl = mongoose.connection.db.collection('submissions');

  const testReqs = await coll.find({
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { sourceMessageId: /test/i },
      { reqCode: /test/i },
    ]
  }).toArray();

  const userNamedReqs = await coll.find({
    $or: [
      { title: /SAP IBP\+OBP/i },
      { title: /Mould Design & Engg Composite Material/i },
      { title: /Tool & Equipment Maintenance/i },
      { title: /Power System Engineer/i },
      { title: /Manual Test Engineer/i },
      { title: /Pipe Stress Analyst/i }
    ]
  }).toArray();

  const numericReqs = await coll.find({
    title: /^[0-9]+(\([^)]+\))?$/
  }).toArray();

  const allToRemoveIds = [
    ...testReqs.map(r => r._id),
    ...userNamedReqs.map(r => r._id),
    ...numericReqs.map(r => r._id)
  ];

  const linkedSubs = await subColl.find({ requirementId: { $in: allToRemoveIds } }).toArray();
  console.log('Linked submissions:');
  linkedSubs.forEach(s => {
    console.log('  Sub:', s._id, 'reqId:', s.requirementId, 'status:', s.stage, 'created:', s.createdAt);
  });

  await mongoose.disconnect();
}
run();
