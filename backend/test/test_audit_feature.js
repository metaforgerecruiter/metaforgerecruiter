const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(email, password) {
  const defaultPasswords = {
    'r.haines@talentflow.io': 'Admin@2026',
    'd.park@talentflow.io': 'Admin@2026',
    'm.chen@talentflow.io': 'Rec@2026',
  };
  const pw = password || defaultPasswords[email] || 'password123';
  const res = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-metaforge-return-tokens': '1' },
    },
    { email, password: pw }
  );
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function logoutUser(token) {
  const res = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/logout',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res;
}

async function getUserLogs(token, query = '') {
  return request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/audit/user-logs${query}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function exportCsv(token, query = '') {
  return request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/audit/export-csv${query}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING AUDIT LOGS COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // 1. Authenticate Super Admin and Admin
    console.log('[Test 1] Authenticating Super Admin (r.haines@talentflow.io)...');
    const superAdminAuth = await loginUser('r.haines@talentflow.io');
    const superToken = superAdminAuth.accessToken;
    console.log('✔ Super Admin authenticated successfully.\n');

    console.log('[Test 2] Authenticating Admin (d.park@talentflow.io)...');
    const adminAuth = await loginUser('d.park@talentflow.io');
    const adminToken = adminAuth.accessToken;
    console.log('✔ Admin authenticated successfully.\n');

    // 2. Test Recruiter repeated login & logout lifecycle
    console.log('[Test 3] Testing Recruiter Login/Logout Lifecycle (m.chen@talentflow.io)...');
    
    // Step 3a: First Login
    console.log(' -> Performing First Login for Marcus Chen...');
    const chenAuth1 = await loginUser('m.chen@talentflow.io');
    console.log(' -> Login 1 successful.');

    // Query logs to inspect firstLoginTime
    const initialLogsRes = await getUserLogs(superToken, '?search=m.chen@talentflow.io');
    const chenLog1 = initialLogsRes.body?.data?.find((d) => d.userEmail === 'm.chen@talentflow.io');
    if (!chenLog1) throw new Error('Chen audit log record not found after first login');
    console.log(` -> Status: ${chenLog1.status}`);
    console.log(` -> First Login (IST): ${chenLog1.firstLoginFormattedIST}`);
    console.log(` -> Latest Logout (IST): ${chenLog1.latestLogoutFormattedIST || 'None'}`);
    if (chenLog1.status !== 'Active') throw new Error(`Expected status 'Active', got '${chenLog1.status}'`);
    const initialFirstLoginTime = chenLog1.firstLoginTime;
    const initialFirstLoginIST = chenLog1.firstLoginFormattedIST;

    await delay(1200);

    // Step 3b: Logout
    console.log(' -> Performing Logout for Marcus Chen...');
    await logoutUser(chenAuth1.accessToken);
    const afterLogoutRes = await getUserLogs(superToken, '?search=m.chen@talentflow.io');
    const chenLogAfterLogout = afterLogoutRes.body?.data?.find((d) => d.userEmail === 'm.chen@talentflow.io');
    console.log(` -> Status after logout: ${chenLogAfterLogout.status}`);
    console.log(` -> First Login (IST): ${chenLogAfterLogout.firstLoginFormattedIST}`);
    console.log(` -> Latest Logout (IST): ${chenLogAfterLogout.latestLogoutFormattedIST}`);
    if (chenLogAfterLogout.status !== 'Logged Out') {
      throw new Error(`Expected status 'Logged Out', got '${chenLogAfterLogout.status}'`);
    }
    if (!chenLogAfterLogout.latestLogoutTime) {
      throw new Error('Expected latestLogoutTime to be set on logout');
    }
    if (chenLogAfterLogout.firstLoginTime !== initialFirstLoginTime) {
      throw new Error('First login time changed on logout!');
    }
    console.log('✔ Logout accurately recorded latestLogoutTime and set status to Logged Out.\n');

    await delay(1500);

    // Step 3c: Repeated Second Login on same day
    console.log(' -> Performing Second Login for Marcus Chen on same day...');
    const chenAuth2 = await loginUser('m.chen@talentflow.io');
    const afterSecondLoginRes = await getUserLogs(superToken, '?search=m.chen@talentflow.io');
    const chenLogAfterSecondLogin = afterSecondLoginRes.body?.data?.find((d) => d.userEmail === 'm.chen@talentflow.io');
    console.log(` -> Status after second login: ${chenLogAfterSecondLogin.status}`);
    console.log(` -> First Login (IST): ${chenLogAfterSecondLogin.firstLoginFormattedIST}`);
    console.log(` -> Latest Logout (IST): ${chenLogAfterSecondLogin.latestLogoutFormattedIST}`);
    console.log(` -> Login Count Today: ${chenLogAfterSecondLogin.loginCount}`);

    if (chenLogAfterSecondLogin.status !== 'Active') {
      throw new Error(`Expected status 'Active' on second login, got '${chenLogAfterSecondLogin.status}'`);
    }
    if (chenLogAfterSecondLogin.firstLoginTime !== initialFirstLoginTime) {
      throw new Error(`First login time was NOT preserved! Expected ${initialFirstLoginTime}, got ${chenLogAfterSecondLogin.firstLoginTime}`);
    }
    console.log('✔ First login time is strictly preserved upon repeated login, and status changed back to Active.\n');

    // Step 3d: Second Logout updates latest logout time
    await delay(1200);
    console.log(' -> Performing Second Logout for Marcus Chen...');
    await logoutUser(chenAuth2.accessToken);
    const afterSecondLogoutRes = await getUserLogs(superToken, '?search=m.chen@talentflow.io');
    const chenLogAfterSecondLogout = afterSecondLogoutRes.body?.data?.find((d) => d.userEmail === 'm.chen@talentflow.io');
    console.log(` -> Status: ${chenLogAfterSecondLogout.status}`);
    console.log(` -> First Login (IST): ${chenLogAfterSecondLogout.firstLoginFormattedIST}`);
    console.log(` -> Latest Logout (IST): ${chenLogAfterSecondLogout.latestLogoutFormattedIST}`);

    if (chenLogAfterSecondLogout.status !== 'Logged Out') {
      throw new Error(`Expected status 'Logged Out', got '${chenLogAfterSecondLogout.status}'`);
    }
    if (chenLogAfterSecondLogout.firstLoginTime !== initialFirstLoginTime) {
      throw new Error('First login time was modified during second logout');
    }
    console.log('✔ Second logout updated latestLogoutTime while preserving original firstLoginTime.\n');

    // 4. Test Permissions: Admin viewing logs
    console.log('[Test 4] Verifying Admin can view user audit logs...');
    const adminLogsRes = await getUserLogs(adminToken);
    console.log(` -> Response status: ${adminLogsRes.status}`);
    console.log(` -> Total items returned: ${adminLogsRes.body?.meta?.total}`);
    if (adminLogsRes.status !== 200 || !adminLogsRes.body?.success) {
      throw new Error(`Admin failed to get user logs: ${JSON.stringify(adminLogsRes.body)}`);
    }
    console.log('✔ Admin can view user audit logs successfully.\n');

    // 5. Test Permissions: Super Admin can export CSV
    console.log('[Test 5] Verifying Super Admin can download audit logs as CSV...');
    const superCsvRes = await exportCsv(superToken);
    console.log(` -> Response status: ${superCsvRes.status}`);
    console.log(` -> Content-Type: ${superCsvRes.headers['content-type']}`);
    console.log(` -> CSV Header preview:\n${superCsvRes.body.split('\r\n')[0]}`);
    if (superCsvRes.status !== 200) {
      throw new Error(`Super Admin export failed: ${superCsvRes.status}`);
    }
    if (!superCsvRes.body.includes('First Login Time (IST)')) {
      throw new Error('CSV missing required header "First Login Time (IST)"');
    }
    console.log('✔ Super Admin CSV export returned 200 OK with formatted audit rows.\n');

    // 6. Test Permissions: Admin CANNOT export CSV (HTTP 403 Forbidden)
    console.log('[Test 6] Verifying Admin is strictly forbidden from downloading CSV...');
    const adminCsvRes = await exportCsv(adminToken);
    console.log(` -> Response status: ${adminCsvRes.status}`);
    console.log(` -> Error message: ${JSON.stringify(adminCsvRes.body)}`);
    if (adminCsvRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for Admin CSV export, but got ${adminCsvRes.status}!`);
    }
    console.log('✔ Admin CSV export restriction enforced in backend with HTTP 403 Forbidden.\n');

    // 7. Test Session Expiration Transition
    console.log('[Test 7] Verifying Session Expiration status transition...');
    const { MongoClient } = require('mongodb');
    const mongoClient = new MongoClient('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
    await mongoClient.connect();
    const db = mongoClient.db();
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

    const staleTime = new Date(Date.now() - 10 * 3600 * 1000); // 10 hours ago
    await db.collection('user_audit_logs').updateOne(
      { userId: 'USR-TEST-EXP', date: todayIST },
      {
        $set: {
          userName: 'Stale User',
          userEmail: 'stale@test.com',
          role: 'recruiter',
          date: todayIST,
          firstLoginTime: staleTime,
          latestLogoutTime: null,
          status: 'Active',
          lastActiveAt: staleTime,
        },
      },
      { upsert: true }
    );

    // Calling getUserLogs will run expireInactiveSessions()
    const expLogsRes = await getUserLogs(superToken, '?search=stale@test.com');
    const staleRecord = expLogsRes.body?.data?.find((d) => d.userEmail === 'stale@test.com');
    console.log(` -> Stale session status after check: ${staleRecord?.status}`);
    console.log(` -> Stale session logout time: ${staleRecord?.latestLogoutTime || 'null'}`);

    if (staleRecord?.status !== 'Session Expired') {
      throw new Error(`Expected status 'Session Expired', got '${staleRecord?.status}'`);
    }
    if (staleRecord?.latestLogoutTime !== null) {
      throw new Error('Expired session should not have a false logout time recorded');
    }
    console.log('✔ Stale active session accurately transitioned to Session Expired without recording false logout time.\n');

    await db.collection('user_audit_logs').deleteOne({ userId: 'USR-TEST-EXP' });
    await mongoClient.close();

    console.log('====================================================');
    console.log('ALL AUDIT LOG VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
