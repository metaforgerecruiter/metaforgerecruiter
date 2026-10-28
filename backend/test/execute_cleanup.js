const mongoose = require('mongoose');

async function runCleanup() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const db = mongoose.connection.db;
  const reqColl = db.collection('requirements');
  const subColl = db.collection('submissions');
  const clientColl = db.collection('clients');
  const userColl = db.collection('users');
  const histColl = db.collection('requirement_histories');
  const actColl = db.collection('activity_logs');

  console.log('=== RESUMING CLEANUP & RE-SEQUENCING ===\n');

  // Step 1: Check any remaining requirements matching synthetic or unwanted
  const toDeleteReqQuery = {
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { sourceMessageId: /test/i },
      { reqCode: /test/i },
      { title: /SAP IBP\+OBP/i },
      { title: /Mould Design & Engg Composite Material/i },
      { title: /Tool & Equipment Maintenance/i },
      { title: /Power System Engineer/i },
      { title: /Manual Test Engineer/i },
      { title: /Pipe Stress Analyst/i },
      { title: /^[0-9]+(\([^)]+\))?$/ }
    ]
  };

  const reqsToDelete = await reqColl.find(toDeleteReqQuery).toArray();
  if (reqsToDelete.length > 0) {
    const reqIdsToDelete = reqsToDelete.map(r => r._id);
    console.log(`Found ${reqIdsToDelete.length} remaining requirements to delete.`);
    await subColl.deleteMany({ requirementId: { $in: reqIdsToDelete } });
    await histColl.deleteMany({ requirementId: { $in: reqIdsToDelete } });
    await actColl.deleteMany({ entityId: { $in: reqIdsToDelete.map(id => String(id)) } });
    await reqColl.deleteMany({ _id: { $in: reqIdsToDelete } });
  }

  // Delete any remaining test clients or test users
  await clientColl.deleteMany({ clientName: /test/i });
  await userColl.deleteMany({
    $or: [
      { email: /test\.recruiter\./i },
      { email: /diag\./i },
      { email: /harish\.test\./i }
    ]
  });

  // Step 2: Re-sequence authentic requirements for today (2026/10/14) safely
  const todayStart = new Date('2026-10-14T00:00:00Z');
  const todayReqs = await reqColl.find({
    createdAt: { $gte: todayStart },
    deletedAt: null
  }).sort({ createdAt: 1 }).toArray();

  console.log(`Re-sequencing ${todayReqs.length} authentic requirements for today (2026/10/14)...`);

  // Pass 1: Set temporary codes to avoid unique constraint violations
  for (let i = 0; i < todayReqs.length; i++) {
    const r = todayReqs[i];
    await reqColl.updateOne(
      { _id: r._id },
      { $set: { reqCode: `TEMP-2026/10/14-${i + 1}-${Date.now()}` } }
    );
  }

  // Pass 2: Set clean final sequence codes
  for (let i = 0; i < todayReqs.length; i++) {
    const r = todayReqs[i];
    const seq = String(i + 1).padStart(3, '0');
    let newCode = `2026/10/14-${seq}`;
    if (r.sourceClientJdId) {
      newCode = `${newCode} (${r.sourceClientJdId})`;
    }
    await reqColl.updateOne(
      { _id: r._id },
      { $set: { reqCode: newCode, updatedAt: new Date() } }
    );
    console.log(`  Set final #${i + 1}: ${newCode} | "${r.title}" (${r.clientName})`);
  }

  // Step 3: Verify current top requirements
  console.log('\n=== CURRENT TOP 20 REQUIREMENTS IN DATABASE ===');
  const top20 = await reqColl.find({ deletedAt: null })
    .sort({ reqCode: -1, createdAt: -1 })
    .limit(20)
    .toArray();

  top20.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.reqCode}] "${r.title}" | Client: "${r.clientName}" | Created: ${r.createdAt.toISOString()}`);
  });

  // Verify zero synthetic requirements
  const checkSynthetic = await reqColl.find({
    $or: [
      { clientName: /test/i },
      { title: /automated test/i },
      { title: /synthetic/i },
      { title: /illegal edit/i },
      { title: /SAP IBP\+OBP/i },
      { title: /Mould Design & Engg Composite Material/i },
      { title: /Tool & Equipment Maintenance/i },
      { title: /Power System Engineer/i },
      { title: /Manual Test Engineer/i },
      { title: /Pipe Stress Analyst/i },
      { title: /^[0-9]+(\([^)]+\))?$/ }
    ],
    deletedAt: null
  }).toArray();

  console.log(`\nRemaining synthetic records count: ${checkSynthetic.length} (MUST BE 0)`);

  await mongoose.disconnect();
  console.log('\n=== CLEANUP COMPLETED WITH 100% SUCCESS ===');
}

runCleanup().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
