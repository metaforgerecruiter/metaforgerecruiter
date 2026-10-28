// Read-only: writes live mail-sourced requirements to a JSON file for the extraction accuracy audit.
// Usage (from backend/): node test/export_live_requirements.js <out.json>
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const rows = await mongoose.connection.db.collection('requirements')
    .find({ deletedAt: null, sourceMessageId: { $ne: null } })
    .project({ reqCode: 1, sourceMessageId: 1, sourceClientJdId: 1, title: 1, clientName: 1, location: 1, workMode: 1,
      mandatorySkills: 1, skillsRequired: 1, experienceRange: 1, budgetText: 1, budgetRange: 1, openings: 1, noticePeriod: 1, status: 1 })
    .toArray();
  fs.writeFileSync(process.argv[2] || 'live_requirements.json', JSON.stringify(rows, null, 1));
  console.log(`exported ${rows.length}`);
  await mongoose.disconnect();
})();
