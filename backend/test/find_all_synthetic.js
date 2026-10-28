const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const col = mongoose.connection.db.collection('requirements');

  const allReqs = await col.find({ deletedAt: null }).toArray();
  console.log(`Scanning ${allReqs.length} active requirements for synthetic/test data...\n`);

  const syntheticList = [];

  for (const r of allReqs) {
    const isSynthetic =
      (r.clientName && /test/i.test(r.clientName)) ||
      (r.title && /(test|automated test|illegal edit)/i.test(r.title)) ||
      (r.sourceMessageId && /test/i.test(r.sourceMessageId)) ||
      (r.sourceClientJdId && /(test|qa-)/i.test(r.sourceClientJdId)) ||
      (r.reqCode && /(test|qa-)/i.test(r.reqCode)) ||
      (r.sourceSubject && /test/i.test(r.sourceSubject));

    if (isSynthetic) {
      syntheticList.push(r);
    }
  }

  console.log(`Found ${syntheticList.length} synthetic / test requirement(s):`);
  for (const s of syntheticList) {
    console.log(`- ${s.reqCode} | Client: "${s.clientName}" | Title: "${s.title}" | MsgId: "${s.sourceMessageId}" | JD: "${s.sourceClientJdId}" | Created: ${s.createdAt}`);
  }

  // Also check if any requirement has no sourceMessageId and was created in the 2026/10/01 or 2026/10/09 testing periods
  const octTests = allReqs.filter(r =>
    !syntheticList.includes(r) &&
    r.reqCode &&
    (r.reqCode.startsWith('2026/10/01-') || r.reqCode.startsWith('2026/10/09-'))
  );
  if (octTests.length > 0) {
    console.log(`\nFound ${octTests.length} October 1 and October 9 test requirements without message IDs:`);
    for (const t of octTests) {
      console.log(`- ${t.reqCode} | Client: "${t.clientName}" | Title: "${t.title}" | MsgId: "${t.sourceMessageId}"`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
