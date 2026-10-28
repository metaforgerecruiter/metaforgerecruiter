const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const col = mongoose.connection.db.collection('requirements');
  const allReqs = await col.find({ deletedAt: null }).sort({ reqCode: -1 }).toArray();

  console.log(`Analyzing ${allReqs.length} active requirements for potential duplicates...\n`);

  // Group by client and normalized title
  const groups = new Map();
  for (const r of allReqs) {
    const normClient = (r.clientName || '').toLowerCase().trim();
    const normTitle = (r.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const key = `${normClient}:::${normTitle}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  let dupCount = 0;
  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      dupCount++;
      console.log(`Duplicate group: "${key}" (${list.length} records):`);
      for (const item of list) {
        console.log(`  - ${item.reqCode} | ID: ${item._id} | MsgId: ${item.sourceMessageId ? item.sourceMessageId.substring(0, 20) : 'null'} | JD: ${item.sourceClientJdId} | Created: ${item.createdAt?.toISOString()}`);
      }
    }
  }

  // Also check synthetic records
  const synthetic = allReqs.filter(r =>
    (r.sourceMessageId && r.sourceMessageId.includes('test')) ||
    (r.sourceClientJdId && r.sourceClientJdId.includes('test')) ||
    (r.reqCode && (r.reqCode === '2026/10/14-002' || r.reqCode === '2026/10/14-003'))
  );
  console.log(`\nSynthetic/mock test requirements found in DB: ${synthetic.length}`);
  for (const s of synthetic) {
    console.log(`  - ${s.reqCode} | Client: "${s.clientName}" | Title: "${s.title}" | MsgId: "${s.sourceMessageId}"`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
