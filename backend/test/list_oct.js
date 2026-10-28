const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements')
    .find({ reqCode: { $regex: /^2026\/10\// } })
    .sort({ reqCode: -1 })
    .toArray();

  console.log(`October 2026 requirements (${reqs.length}):\n`);
  for (const r of reqs) {
    console.log(`${r.reqCode} | Client: "${r.clientName}" | Title: "${r.title}" | MsgId: ${r.sourceMessageId ? r.sourceMessageId.substring(0, 25) : 'null'} | Arrived: ${r.emailArrivedTime?.toISOString()} | Created: ${r.createdAt?.toISOString()}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
