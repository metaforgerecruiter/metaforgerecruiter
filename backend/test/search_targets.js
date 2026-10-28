const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const sampleAcc = await mongoose.connection.db.collection('requirements').findOne({
    clientName: 'Accenture',
    sourceClientJdId: '211238-1'
  });
  console.log('Full sample Accenture doc:');
  console.log(JSON.stringify(sampleAcc, null, 2));

  await mongoose.disconnect();
}
run();
