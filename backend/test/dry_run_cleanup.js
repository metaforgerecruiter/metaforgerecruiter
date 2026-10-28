const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const db = mongoose.connection.db;
  const reqColl = db.collection('requirements');
  const subColl = db.collection('submissions');
  const clientColl = db.collection('clients');
  const userColl = db.collection('users');
  const histColl = db.collection('requirement_histories');

  console.log('=== DRY RUN: CLEANUP ALL SYNTHETIC DATA ===\n');

  // 1. Requirements to remove:
  // a) Explicit test
  const testReqs = await reqColl.find({
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { sourceMessageId: /test/i },
      { reqCode: /test/i },
    ]
  }).toArray();
  console.log(`1. Test requirements to delete: ${testReqs.length}`);
  testReqs.forEach(r => console.log(`   - [${r.reqCode}] "${r.title}" (${r.clientName})`));

  // b) User specifically requested 6 titles
  const userSpecifiedReqs = await reqColl.find({
    $or: [
      { title: /SAP IBP\+OBP/i },
      { title: /Mould Design & Engg Composite Material/i },
      { title: /Tool & Equipment Maintenance/i },
      { title: /Power System Engineer/i },
      { title: /Manual Test Engineer/i },
      { title: /Pipe Stress Analyst/i }
    ]
  }).toArray();
  console.log(`\n2. User-specified items to delete: ${userSpecifiedReqs.length}`);
  userSpecifiedReqs.forEach(r => console.log(`   - [${r.reqCode}] "${r.title}" (${r.clientName})`));

  // c) Numeric-titled corrupt Accenture items
  const numericReqs = await reqColl.find({
    title: /^[0-9]+(\([^)]+\))?$/
  }).toArray();
  console.log(`\n3. Corrupt numeric-titled requirements to delete: ${numericReqs.length}`);

  // Combine all requirement IDs to delete
  const allReqIdsToDelete = [
    ...testReqs.map(r => r._id),
    ...userSpecifiedReqs.map(r => r._id),
    ...numericReqs.map(r => r._id)
  ];
  console.log(`Total requirements to delete: ${allReqIdsToDelete.length}`);

  // 2. Test Clients to delete
  const testClients = await clientColl.find({ clientName: /test/i }).toArray();
  console.log(`\n4. Test clients to delete: ${testClients.length}`);
  testClients.forEach(c => console.log(`   - ${c._id} ${c.clientName}`));

  // 3. Test Users to delete
  const testUsers = await userColl.find({
    $or: [
      { email: /test\.recruiter\./i },
      { email: /diag\./i },
      { email: /harish\.test\./i }
    ]
  }).toArray();
  console.log(`\n5. Test users to delete: ${testUsers.length}`);

  // 4. Check remaining requirements for 2026/10/14
  const remainingToday = await reqColl.find({
    _id: { $nin: allReqIdsToDelete },
    createdAt: { $gte: new Date('2026-10-14T00:00:00Z') },
    deletedAt: null
  }).sort({ createdAt: 1 }).toArray();

  console.log(`\n6. Remaining authentic requirements for today (2026/10/14): ${remainingToday.length}`);
  remainingToday.forEach((r, idx) => {
    const seq = String(idx + 1).padStart(3, '0');
    console.log(`   ${idx + 1}. Will become: [2026/10/14-${seq}] "${r.title}" (${r.clientName})`);
  });

  await mongoose.disconnect();
}
run();
