// Read-only: prints the live mail-extraction scheduler status from the running backend.
// Usage (from backend/): node test/scheduler_status.js
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  const admin = await mongoose.connection.db.collection('users')
    .findOne({ orgId: { $ne: null }, deletedAt: null, role: { $in: ['superadmin', 'admin'] } });
  await mongoose.disconnect();
  const token = jwt.sign(
    { sub: String(admin._id), userId: String(admin.userId || admin._id), email: admin.email, role: admin.role, orgId: String(admin.orgId) },
    process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set'); })(),
    { expiresIn: '5m' },
  );
  const port = process.env.PORT || 3001;
  const res = await fetch(`http://127.0.0.1:${port}/api/v1/requirements/scheduler-status`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  const s = body.data || body;
  console.log(JSON.stringify({ ...s, lastResult: s.lastResult && { ...s.lastResult, output: undefined } }, null, 1).slice(0, 3000));
})();
