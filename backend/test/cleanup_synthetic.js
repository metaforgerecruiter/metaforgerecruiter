const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const col = mongoose.connection.db.collection('requirements');

  const res = await col.deleteMany({
    $or: [
      { sourceMessageId: 'TEST-MSG-ID-1791962248386' },
      { sourceMessageId: 'AQMkADY4OTBkMWE3LTkxNmEtNGNiZC1hYTU4LTAxZTNkZGFjOGQ1NgBGAAADhLw5_test_graph_id_001' },
      { reqCode: { $in: ['2026/10/14-002', '2026/10/14-003'] } }
    ]
  });

  console.log(`Deleted ${res.deletedCount} synthetic mock test requirement(s) from earlier test scripts.`);
  await mongoose.disconnect();
}

main().catch(console.error);
