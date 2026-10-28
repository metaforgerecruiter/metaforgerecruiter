const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements')
    .find({ reqCode: { $regex: /^2026\/10\// } })
    .toArray();

  const msgMap = new Map();
  for (const r of reqs) {
    if (!r.sourceMessageId) continue;
    if (!msgMap.has(r.sourceMessageId)) msgMap.set(r.sourceMessageId, []);
    msgMap.get(r.sourceMessageId).push(r);
  }

  console.log(`October 2026 message IDs with >1 requirement:`);
  let found = 0;
  for (const [msgId, list] of msgMap.entries()) {
    if (list.length > 1) {
      found++;
      console.log(`\nMsgId: ${msgId.substring(0, 30)}... (${list.length} requirements):`);
      for (const item of list) {
        console.log(`   - ${item.reqCode} | Client: ${item.clientName} | Title: "${item.title}" | JD: ${item.sourceClientJdId}`);
      }
    }
  }

  if (found === 0) {
    console.log('None! All message IDs are unique.');
  }

  await mongoose.disconnect();
}

main().catch(console.error);
