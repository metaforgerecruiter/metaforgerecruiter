const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const coll = mongoose.connection.db.collection('requirements');

  const toRemoveQuery = {
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { sourceMessageId: /test/i },
      { reqCode: /test/i },
      { title: /SAP IBP\+OBP/i },
      { title: /Mould Design & Engg Composite Material/i },
      { title: /Tool & Equipment Maintenance/i },
      { title: /Power System Engineer/i },
      { title: /Manual Test Engineer/i },
      { title: /Pipe Stress Analyst/i },
      { title: /^[0-9]+(\([^)]+\))?$/ }
    ]
  };

  const remaining = await coll.find({
    $nor: [toRemoveQuery],
    deletedAt: null
  }).sort({ reqCode: -1, createdAt: -1 }).limit(40).toArray();

  console.log(`Top remaining requirements (${remaining.length} shown):`);
  remaining.forEach((r, i) => {
    console.log(`${i+1}. [${r.reqCode}] Title: "${r.title}" | Client: "${r.clientName}" | JD ID: "${r.sourceClientJdId || ''}" | Date: ${r.createdAt}`);
  });

  await mongoose.disconnect();
}
run();
