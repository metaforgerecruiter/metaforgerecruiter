const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements')
    .find({ deletedAt: null })
    .sort({ reqCode: -1 })
    .limit(15)
    .toArray();

  console.log('Top 15 requirements field values:');
  reqs.forEach((r, idx) => {
    console.log(`\n--- [#${idx+1}] ${r.reqCode} | ${r.title} | ${r.clientName} ---`);
    console.log('skillsRequired:', JSON.stringify(r.skillsRequired));
    console.log('mandatorySkills:', JSON.stringify(r.mandatorySkills));
    console.log('budgetRange:', JSON.stringify(r.budgetRange));
    console.log('budget:', JSON.stringify(r.budget));
    console.log('raw description preview:', (r.description || '').substring(0, 150));
  });

  await mongoose.disconnect();
}
run();
