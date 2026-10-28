// Hold or release the mailbox lease used by the backend scheduler (job_locks/mail-extraction),
// so a manual pipeline run never overlaps a scheduled one.
// Usage (from backend/): node test/mail_lease.js hold <minutes> | release
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const [cmd, minutes] = process.argv.slice(2);
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const locks = mongoose.connection.db.collection('job_locks');
  if (cmd === 'hold') {
    const now = new Date();
    try {
      const res = await locks.findOneAndUpdate(
        { _id: 'mail-extraction', expiresAt: { $lt: now } },
        { $set: { owner: 'manual-maintenance', expiresAt: new Date(now.getTime() + Number(minutes || 30) * 60000) } },
        { upsert: true, returnDocument: 'after' },
      );
      const doc = res && res.value !== undefined ? res.value : res;
      if (!doc || doc.owner !== 'manual-maintenance') throw new Error('busy');
      console.log(`lease held until ${doc.expiresAt.toISOString()}`);
    } catch (e) {
      console.error('Mailbox lease is held by a running extraction; try again in a minute.');
      process.exitCode = 1;
    }
  } else if (cmd === 'release') {
    await locks.deleteOne({ _id: 'mail-extraction', owner: 'manual-maintenance' });
    console.log('lease released');
  } else {
    console.error('usage: node test/mail_lease.js hold <minutes> | release');
    process.exitCode = 2;
  }
  await mongoose.disconnect();
})();
