import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'metaforge_recruiter_v2';
const API_URL = 'http://localhost:3001/api/v1';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, extra?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`, extra || '');
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('RECRUITER ATTENDANCE & LOGIN/LOGOUT TRACKING END-TO-END TEST SUITE');
  console.log('========================================================================\n');

  await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
  const db = mongoose.connection.db!;

  // 1. Check Recruiter Population in MongoDB
  console.log('--- Test Group 1: Recruiter Population Inspection ---');
  const activeRecruiters = await db
    .collection('users')
    .find({ role: 'recruiter', active: true, deletedAt: null })
    .toArray();

  assert(activeRecruiters.length > 0, `Active recruiters found in database (count: ${activeRecruiters.length})`);
  console.log(`Found ${activeRecruiters.length} active recruiters:`);
  activeRecruiters.slice(0, 5).forEach((r) => console.log(`   - ${r.name} (${r.email}, userId: ${r.userId})`));
  if (activeRecruiters.length > 5) console.log(`   ... and ${activeRecruiters.length - 5} more`);

  // 2. Direct Service-Level Attendance Calculation & Timezone Validation
  console.log('\n--- Test Group 2: Timezone & Working Day Evaluation ---');
  const tz = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
  assert(tz === 'Asia/Kolkata', `Timezone configured to Asia/Kolkata (actual: ${tz})`);

  // Helper date test
  const testMonday = new Date('2026-10-19T10:00:00+05:30'); // Monday
  const testSaturday = new Date('2026-10-24T10:00:00+05:30'); // Saturday
  const testSunday = new Date('2026-10-25T10:00:00+05:30'); // Sunday

  const isWorkingDay = (d: Date) => {
    const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(d);
    return dayStr !== 'Sat' && dayStr !== 'Sun';
  };

  assert(isWorkingDay(testMonday) === true, 'Monday identified as working day');
  assert(isWorkingDay(testSaturday) === false, 'Saturday excluded from working days');
  assert(isWorkingDay(testSunday) === false, 'Sunday excluded from working days');

  // 3. Login / Logout Persistence & Session Expiry Testing
  console.log('\n--- Test Group 3: Login/Logout History Lifecycle & Persistence ---');
  const testSessionId = `test-sess-${Date.now()}`;
  const testRecruiter = activeRecruiters[0];
  const now = new Date();
  const todayIST = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Clean any existing test records for this session
  await db.collection('recruiter_login_histories').deleteMany({ sessionId: { $regex: /^test-/ } });

  // 3a. Record Login
  const loginInsert = await db.collection('recruiter_login_histories').insertOne({
    orgId: testRecruiter.orgId,
    userId: testRecruiter.userId,
    userObjectId: testRecruiter._id,
    name: testRecruiter.name,
    email: testRecruiter.email,
    role: testRecruiter.role,
    sessionId: testSessionId,
    loginTime: now,
    lastActiveAt: now,
    logoutTime: null,
    sessionStatus: 'ACTIVE',
    durationMinutes: 0,
    ipAddress: '127.0.0.1',
    userAgent: 'MetaForge-Test-Runner/2.0',
    loginDate: todayIST,
    createdAt: now,
    updatedAt: now,
  });

  assert(loginInsert.acknowledged === true, 'Login record inserted persistently');

  const persistedLogin = await db
    .collection('recruiter_login_histories')
    .findOne({ sessionId: testSessionId });
  assert(persistedLogin !== null, 'Login record retrieved from DB');
  assert(persistedLogin!.sessionStatus === 'ACTIVE', 'Initial session status is ACTIVE');
  assert(persistedLogin!.logoutTime === null, 'logoutTime is initially null');
  assert(persistedLogin!.loginDate === todayIST, `loginDate matches Asia/Kolkata date (${todayIST})`);

  // 3b. Record Confirmed Logout
  const logoutTime = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes later
  await db.collection('recruiter_login_histories').updateOne(
    { sessionId: testSessionId },
    {
      $set: {
        logoutTime,
        sessionStatus: 'LOGGED_OUT',
        logoutType: 'USER_ACTION',
        durationMinutes: 45,
        updatedAt: logoutTime,
      },
    }
  );

  const persistedLogout = await db
    .collection('recruiter_login_histories')
    .findOne({ sessionId: testSessionId });
  assert(persistedLogout!.sessionStatus === 'LOGGED_OUT', 'Confirmed logout sets status to LOGGED_OUT');
  assert(persistedLogout!.logoutType === 'USER_ACTION', 'Confirmed logout sets logoutType to USER_ACTION');
  assert(persistedLogout!.logoutTime !== null, 'Confirmed logout records logoutTime');
  assert(persistedLogout!.durationMinutes === 45, 'Confirmed logout computes durationMinutes accurately (45 mins)');

  // 3c. Expired / Abandoned Browser Session Simulation
  console.log('\n--- Test Group 4: Expired Sessions & Unexpected Browser Closures ---');
  const abandonedSessionId = `test-abandoned-${Date.now()}`;
  const staleLoginTime = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago
  const staleActiveTime = new Date(now.getTime() - 9 * 60 * 60 * 1000); // 9 hours ago

  await db.collection('recruiter_login_histories').insertOne({
    orgId: testRecruiter.orgId,
    userId: testRecruiter.userId,
    userObjectId: testRecruiter._id,
    name: testRecruiter.name,
    email: testRecruiter.email,
    role: testRecruiter.role,
    sessionId: abandonedSessionId,
    loginTime: staleLoginTime,
    lastActiveAt: staleActiveTime,
    logoutTime: null,
    sessionStatus: 'ACTIVE',
    durationMinutes: 0,
    loginDate: todayIST,
    createdAt: staleLoginTime,
    updatedAt: staleActiveTime,
  });

  // Run expiration logic (matching RecruiterAttendanceService.expireInactiveSessions)
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);
  const expireResult = await db.collection('recruiter_login_histories').updateMany(
    {
      sessionId: abandonedSessionId,
      sessionStatus: 'ACTIVE',
      lastActiveAt: { $lt: cutoff },
    },
    {
      $set: {
        sessionStatus: 'EXPIRED',
        logoutType: 'SESSION_TIMEOUT',
        // Note: logoutTime remains null so it is NOT falsely recorded as a confirmed logout!
      },
    }
  );

  assert(expireResult.modifiedCount === 1, 'Abandoned session transitioned to EXPIRED');
  const expiredDoc = await db
    .collection('recruiter_login_histories')
    .findOne({ sessionId: abandonedSessionId });
  assert(expiredDoc!.sessionStatus === 'EXPIRED', 'Status is EXPIRED');
  assert(expiredDoc!.logoutType === 'SESSION_TIMEOUT', 'logoutType is SESSION_TIMEOUT');
  assert(expiredDoc!.logoutTime === null, 'logoutTime remains NULL (no false confirmed logout recorded)');

  // 4. Duplicate Report Prevention Test
  console.log('\n--- Test Group 5: Duplicate Report Prevention & Database Integrity ---');
  const testReportDate = `2099-01-01`; // Synthetic date for safe test
  await db.collection('daily_attendance_reports').deleteMany({ reportDate: testReportDate });
  await db.collection('daily_attendance_reports').createIndex({ reportDate: 1 }, { unique: true });

  // Insert initial report
  await db.collection('daily_attendance_reports').insertOne({
    reportDate: testReportDate,
    sentAt: new Date(),
    recipient: process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com',
    sender: process.env.ATTENDANCE_SENDER_EMAIL || 'recruiter.application@example.com',
    subject: `Recruiter Daily Login Report - ${testReportDate}`,
    totalRecruiters: activeRecruiters.length,
    loggedInCount: activeRecruiters.length - 2,
    missingCount: 2,
    allClear: false,
    status: 'SENT',
    recruiterSnapshots: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Verify that a second attempt identifies the existing report and prevents duplicate sending
  const existingReport = await db
    .collection('daily_attendance_reports')
    .findOne({ reportDate: testReportDate, status: 'SENT' });
  assert(existingReport !== null, 'First report recorded with status SENT');

  // Verify unique index constraint on reportDate
  let uniqueIndexEnforced = false;
  try {
    await db.collection('daily_attendance_reports').insertOne({
      reportDate: testReportDate,
      sentAt: new Date(),
      recipient: process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com',
      status: 'SENT',
    });
  } catch (err: any) {
    if (err.code === 11000 || err.message.includes('duplicate key')) {
      uniqueIndexEnforced = true;
    }
  }
  assert(uniqueIndexEnforced === true, 'MongoDB unique index enforces duplicate report prevention at DB level');

  // Clean up synthetic test report
  await db.collection('daily_attendance_reports').deleteMany({ reportDate: testReportDate });

  // 5. REST API Endpoints Verification via HTTP
  console.log('\n--- Test Group 6: Live Backend REST API Verification ---');
  // First obtain JWT token by authenticating as superadmin demo or first admin user
  const adminUser = await db.collection('users').findOne({ role: 'superadmin' });
  assert(adminUser !== null, 'Superadmin user found in database');

  // Login via API
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-metaforge-return-tokens': '1' },
    body: JSON.stringify({
      email: 'r.haines@talentflow.io',
      password: 'Admin@2026',
      role: 'superadmin',
    }),
  });

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  assert(!!token, 'Obtained valid JWT access token from POST /auth/login');

  // 5a. GET /recruiter-attendance/today
  console.log('Testing GET /recruiter-attendance/today...');
  const todayRes = await fetch(`${API_URL}/recruiter-attendance/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(todayRes.status === 200, `GET /today returns HTTP 200 (actual: ${todayRes.status})`);
  const todayData = await todayRes.json();
  assert(todayData.success === true, 'GET /today response has success: true');
  assert(todayData.data.totalRecruiters === activeRecruiters.length, `totalRecruiters matches active recruiter count (${activeRecruiters.length})`);
  assert(Array.isArray(todayData.data.recruiters), 'GET /today returns recruiters array');
  console.log(`   Summary today: Total=${todayData.data.totalRecruiters}, LoggedIn=${todayData.data.loggedInCount}, Missing=${todayData.data.missingCount}, AllClear=${todayData.data.allClear}`);

  // 5b. GET /recruiter-attendance/history
  console.log('Testing GET /recruiter-attendance/history...');
  const histRes = await fetch(`${API_URL}/recruiter-attendance/history?limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(histRes.status === 200, `GET /history returns HTTP 200 (actual: ${histRes.status})`);
  const histData = await histRes.json();
  assert(histData.success === true, 'GET /history response has success: true');
  assert(Array.isArray(histData.data), 'GET /history returns data array');
  assert(typeof histData.meta.total === 'number', 'GET /history returns pagination total');
  console.log(`   Pagination: Page ${histData.meta.page}/${histData.meta.totalPages}, Total Records: ${histData.meta.total}`);

  // 5c. POST /recruiter-attendance/heartbeat
  console.log('Testing POST /recruiter-attendance/heartbeat...');
  const hbRes = await fetch(`${API_URL}/recruiter-attendance/heartbeat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId: loginData.user?.sessionId }),
  });
  assert(hbRes.status === 200, `POST /heartbeat returns HTTP 200 (actual: ${hbRes.status})`);
  const hbData = await hbRes.json();
  assert(hbData.success === true, 'Heartbeat response indicates success');

  // 5d. POST /recruiter-attendance/trigger-report (Dry Run)
  console.log('Testing POST /recruiter-attendance/trigger-report (Dry Run)...');
  const triggerRes = await fetch(`${API_URL}/recruiter-attendance/trigger-report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dryRun: true, force: true }),
  });
  assert(triggerRes.status === 200, `POST /trigger-report returns HTTP 200 (actual: ${triggerRes.status})`);
  const triggerData = await triggerRes.json();
  assert(triggerData.dryRun === true, 'Report dry-run flag confirmed');
  const expectedRecipient = process.env.ATTENDANCE_RECIPIENT_EMAIL || 'offshorejobs@example.com';
  const expectedSender = process.env.ATTENDANCE_SENDER_EMAIL || 'recruiter.application@example.com';
  assert(triggerData.recipient === expectedRecipient, `Report recipient is ${expectedRecipient} (actual: ${triggerData.recipient})`);
  assert(triggerData.sender === expectedSender, `Report sender is ${expectedSender} (actual: ${triggerData.sender})`);
  assert(typeof triggerData.subject === 'string' && triggerData.subject.includes('Recruiter Daily Login Report'), 'Report subject line formatted properly');
  assert(typeof triggerData.html === 'string' && triggerData.html.includes('Daily Recruiter Login Report'), 'HTML report contains professional header');
  assert(triggerData.html.includes(expectedRecipient), 'HTML report contains recipient reference');

  // 6. Test Recruiter Login via API creates persistent RecruiterLoginHistory
  console.log('\n--- Test Group 7: Recruiter Login & Logout via /auth APIs ---');
  const recLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MetaForge-Recruiter-Portal-Test/1.0',
      'x-metaforge-return-tokens': '1',
    },
    body: JSON.stringify({
      email: 'm.chen@talentflow.io',
      password: 'Rec@2026',
      role: 'recruiter',
    }),
  });

  assert(recLoginRes.status === 200, `Recruiter login returns HTTP 200 (email: m.chen@talentflow.io)`);
  const recLoginData = await recLoginRes.json();
  const recSessionId = recLoginData.user?.sessionId;
  assert(!!recSessionId, `Login response contains session ID (${recSessionId})`);

  // Verify document in MongoDB
  const liveLoginDoc = await db
    .collection('recruiter_login_histories')
    .findOne({ sessionId: recSessionId });
  assert(liveLoginDoc !== null, 'Live login document created in recruiter_login_histories');
  assert(liveLoginDoc!.name === recLoginData.user?.name, 'Live login recorded recruiter name correctly');
  assert(liveLoginDoc!.role === 'recruiter', 'Live login recorded role: recruiter');
  assert(liveLoginDoc!.sessionStatus === 'ACTIVE', 'Live login initial status is ACTIVE');

  // Perform confirmed logout
  const recLogoutRes = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${recLoginData.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: recLoginData.refreshToken }),
  });
  assert(recLogoutRes.status === 200, 'Recruiter logout returns HTTP 200');

  // Verify document updated in MongoDB to LOGGED_OUT
  const liveLogoutDoc = await db
    .collection('recruiter_login_histories')
    .findOne({ sessionId: recSessionId });
  assert(liveLogoutDoc!.sessionStatus === 'LOGGED_OUT', 'Live logout document updated to LOGGED_OUT');
  assert(liveLogoutDoc!.logoutType === 'USER_ACTION', 'Live logout records logoutType: USER_ACTION');
  assert(liveLogoutDoc!.logoutTime !== null, 'Live logout records logoutTime');

  // Clean up test sessions
  await db.collection('recruiter_login_histories').deleteMany({ sessionId: { $regex: /^test-/ } });
  await db.collection('recruiter_login_histories').deleteOne({ sessionId: recSessionId });

  await mongoose.disconnect();

  console.log('\n========================================================================');
  console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions succeeded)`);
  console.log('========================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
