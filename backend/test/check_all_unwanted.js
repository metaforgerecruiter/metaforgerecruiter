const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const coll = mongoose.connection.db.collection('requirements');

  // 1. Check all synthetic test records
  const syntheticRecords = await coll.find({
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { sourceMessageId: /test/i },
      { reqCode: /test/i },
      { sourceClientJdId: /test/i }
    ],
    deletedAt: null
  }).toArray();
  console.log('Explicit Synthetic/Test records active:', syntheticRecords.length);
  syntheticRecords.forEach(r => console.log('  -', r._id, r.reqCode, r.title, r.clientName));

  // 2. Check the 6 user-specified titles
  const userSpecified = [
    'SAP IBP+OBP',
    'Mould Design & Engg Composite Material',
    'Tool & Equipment Maintenance',
    'Power System Engineer',
    'Manual Test Engineer',
    'Pipe Stress Analyst'
  ];
  console.log('\nUser-specified items:');
  for (const title of userSpecified) {
    const found = await coll.find({
      title: new RegExp(title, 'i'),
      deletedAt: null
    }).toArray();
    console.log(`  "${title}": ${found.length} active records`);
    found.forEach(r => console.log(`    -> id: ${r._id}, reqCode: "${r.reqCode}", title: "${r.title}", client: "${r.clientName}", date: ${r.createdAt}`));
  }

  // 3. Check numeric-titled records (e.g. title: "8", "9")
  const numericTitled = await coll.find({
    title: /^[0-9]+(\([^)]+\))?$/,
    deletedAt: null
  }).toArray();
  console.log(`\nNumeric-titled corrupt records: ${numericTitled.length} active records`);

  await mongoose.disconnect();
}
run();
