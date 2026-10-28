const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements').find({
    $or: [
      { skillsRequired: { $regex: 'Joiner', $options: 'i' } },
      { skillsRequired: { $regex: 'Kallol', $options: 'i' } },
      { skillsRequired: { $regex: 'Experience:', $options: 'i' } },
      { mandatorySkills: { $regex: 'Joiner', $options: 'i' } },
      { mandatorySkills: { $regex: 'Kallol', $options: 'i' } }
    ]
  }).toArray();
  console.log('Found affected requirements count:', reqs.length);
  reqs.forEach(r => {
    console.log(`\n--- ${r.reqCode} | ${r.title} | ${r.clientName} ---`);
    console.log('skillsRequired:', r.skillsRequired);
    console.log('mandatorySkills:', r.mandatorySkills);
  });
  await mongoose.disconnect();
}
run();
