const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const allReqs = await mongoose.connection.db.collection('requirements')
    .find({})
    .sort({ reqCode: -1 })
    .toArray();

  console.log(`Total requirements in DB: ${allReqs.length}\n`);
  for (const r of allReqs) {
    const isSynthetic = (r.sourceMessageId && r.sourceMessageId.includes('test')) || (r.sourceClientJdId && r.sourceClientJdId.includes('test'));
    console.log(`${r.reqCode} | Client: "${r.clientName}" | Title: "${r.title}" | MsgId: ${r.sourceMessageId ? r.sourceMessageId.substring(0, 30) : 'null'} | Synthetic: ${isSynthetic}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
