require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function backupAndVerify() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'metaforge_recruiter_v2';
  const verifyDbName = `${dbName}_restore_verify`;

  const backupDir = path.resolve(__dirname, `../../backups/pre_upgrade_backup_${Date.now()}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const client = new MongoClient(uri);
  await client.connect();
  console.log(`Connected to MongoDB at ${uri}`);

  const sourceDb = client.db(dbName);
  const verifyDb = client.db(verifyDbName);

  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in database "${dbName}".`);

  const manifest = {
    sourceDb: dbName,
    createdAt: new Date().toISOString(),
    collections: {},
  };

  // 1. Export every collection to JSON files
  console.log(`\n--- Starting Backup to ${backupDir} ---`);
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;
    const col = sourceDb.collection(colName);
    const docs = await col.find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    manifest.collections[colName] = docs.length;
    console.log(`Backed up "${colName}": ${docs.length} documents.`);
  }

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('--- Backup Completed Successfully ---\n');

  // 2. Verify Restoration into verifyDb
  console.log(`--- Verifying Restoration into temporary database "${verifyDbName}" ---`);
  // Clean verifyDb first if exists
  await verifyDb.dropDatabase().catch(() => {});

  let allMatched = true;
  for (const [colName, expectedCount] of Object.entries(manifest.collections)) {
    const filePath = path.join(backupDir, `${colName}.json`);
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const verifyCol = verifyDb.collection(colName);

    if (docs.length > 0) {
      await verifyCol.insertMany(docs);
    }
    const restoredCount = await verifyCol.countDocuments();
    if (restoredCount !== expectedCount) {
      console.error(`MISMATCH in "${colName}": expected ${expectedCount}, got ${restoredCount}`);
      allMatched = false;
    } else {
      console.log(`Verified "${colName}": ${restoredCount} / ${expectedCount} documents restored.`);
    }
  }

  // Cleanup verifyDb
  await verifyDb.dropDatabase();
  console.log(`Cleaned up temporary verification database "${verifyDbName}".`);

  await client.close();

  if (!allMatched) {
    console.error('DATABASE BACKUP VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('\nDATABASE BACKUP & RESTORE VERIFICATION PASSED 100%!');
    console.log(`Backup files safely preserved in: ${backupDir}`);
  }
}

backupAndVerify().catch(err => {
  console.error('Error during backup/verify:', err);
  process.exit(1);
});
