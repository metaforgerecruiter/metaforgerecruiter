// Prints how many requirements were created by the auto mail extraction pipeline.
// Usage (from backend/): node test/count_mail_requirements.js
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const reqs = mongoose.connection.db.collection('requirements');
  const total = await reqs.countDocuments({ deletedAt: null });
  const fromMail = await reqs.countDocuments({ deletedAt: null, sourceMessageId: { $ne: null } });
  console.log(`requirements: total=${total} fromMail=${fromMail}`);
  const recent = await reqs
    .find({ sourceMessageId: { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(Number(process.argv[2] || 15))
    .project({ reqCode: 1, title: 1, clientName: 1, location: 1, experienceRange: 1, createdAt: 1 })
    .toArray();
  for (const r of recent) {
    const exp = r.experienceRange ? `${r.experienceRange.min}-${r.experienceRange.max}y` : '';
    console.log(`${r.reqCode} | ${r.clientName} | ${r.title} | ${r.location || ''} | ${exp} | ${r.createdAt?.toISOString?.() || ''}`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
