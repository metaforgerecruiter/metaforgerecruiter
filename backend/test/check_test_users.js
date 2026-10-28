const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const db = mongoose.connection.db;

  const testUsers = await db.collection('users').find({
    $or: [
      { email: /test/i },
      { name: /test/i },
      { email: /diag\./i }
    ]
  }).toArray();
  console.log('Test users found:', testUsers.length);
  testUsers.forEach(u => console.log('  -', u._id, u.name, u.email, u.role));

  await mongoose.disconnect();
}
run();
