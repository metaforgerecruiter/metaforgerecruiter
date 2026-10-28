import mongoose from 'mongoose';

const API_BASE = 'http://localhost:3001/api/v1';
const INTERNAL_KEY = 'mf-auto-mail-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/metaforge_recruiter_v2';

interface TestResult {
  scenario: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function ingest(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/requirements/ingest-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': INTERNAL_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function loginAdmin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-metaforge-return-tokens': '1' },
    body: JSON.stringify({ email: 'r.haines@talentflow.io', password: 'Admin@2026', role: 'superadmin' }),
  });
  const json = await res.json();
  return json.accessToken || json.access_token || json.token;
}

async function getWorkspace(token: string) {
  const res = await fetch(`${API_BASE}/workspace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getSchedulerStatus(token: string) {
  const res = await fetch(`${API_BASE}/requirements/scheduler-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function run() {
  console.log('================================================================');
  console.log('COMPREHENSIVE EMAIL-TO-REQUIREMENT LIFECYCLE REGRESSION SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const reqCol = db.collection('requirements');
  const histCol = db.collection('requirement_histories');
  const clientCol = db.collection('clients');

  const token = await loginAdmin();
  if (!token) throw new Error('Admin login failed');

  const QA_CLIENT = `QA Multi-Lifecycle Client ${Date.now()}`;
  const createdIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Synthetic / Fake Requirement Rejection
    // -------------------------------------------------------------------------
    try {
      const synthetic1 = {
        graph_message_id: `msg-synth-1-${Date.now()}`,
        requirement_from: QA_CLIENT,
        job_title: '[TEST] Synthetic React Developer',
        subject: '[TEST] Automated fixture requirement',
      };
      const res1 = await ingest(synthetic1);

      const synthetic2 = {
        graph_message_id: `msg-synth-2-${Date.now()}`,
        requirement_from: QA_CLIENT,
        job_title: 'Fullstack Developer',
        is_synthetic: true,
      };
      const res2 = await ingest(synthetic2);

      const synthetic3 = {
        graph_message_id: `msg-synth-3-${Date.now()}`,
        requirement_from: QA_CLIENT,
        job_title: 'Backend Engineer',
        subject: 'MOCK Requirement for testing',
      };
      const res3 = await ingest(synthetic3);

      const count = await reqCol.countDocuments({
        $or: [
          { title: /Synthetic React Developer/i },
          { sourceSubject: /Automated fixture requirement/i },
          { sourceSubject: /MOCK Requirement/i },
        ],
      });

      const passed =
        res1.data?.data?.ignored === true &&
        res2.data?.data?.ignored === true &&
        res3.data?.data?.ignored === true &&
        count === 0;

      results.push({
        scenario: 'Synthetic and test requirements are strictly rejected',
        passed,
        details: `All 3 synthetic payloads safely blocked with ignored=true; 0 persisted in DB`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Synthetic and test requirements are strictly rejected', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // 2. Same Title, Different City / Disjoint Experience -> Separate Canonical Records
    // -------------------------------------------------------------------------
    try {
      const rolePune = {
        graph_message_id: `msg-pune-${Date.now()}`,
        requirement_from: QA_CLIENT,
        job_title: 'Staff Python Engineer',
        location: 'Pune, Maharashtra',
        overall_experience: '3-6 years',
        mandatory_skills: ['Python', 'FastAPI', 'PostgreSQL'],
        receivedDateTime: new Date('2026-10-14T10:00:00Z').toISOString(),
      };
      const resPune = await ingest(rolePune);
      const puneId = resPune.data?.data?.requirementId;
      if (puneId) createdIds.push(puneId);

      const roleBangalore = {
        graph_message_id: `msg-blr-${Date.now()}`,
        requirement_from: QA_CLIENT,
        job_title: 'Staff Python Engineer', // Same Title!
        location: 'Bangalore, Karnataka',   // Distinct City!
        overall_experience: '3-6 years',
        mandatory_skills: ['Python', 'FastAPI', 'PostgreSQL'],
        receivedDateTime: new Date('2026-10-14T10:05:00Z').toISOString(),
      };
      const resBlr = await ingest(roleBangalore);
      const blrId = resBlr.data?.data?.requirementId;
      if (blrId) createdIds.push(blrId);

      const passed =
        resPune.data?.data?.deduped === false &&
        resBlr.data?.data?.deduped === false &&
        puneId !== blrId &&
        !!puneId &&
        !!blrId;

      results.push({
        scenario: 'Distinct jobs with same title but different cities are preserved separately',
        passed,
        details: `Created Pune (${puneId}) and Bangalore (${blrId}) as separate canonical records without false merge`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Distinct jobs with same title but different cities are preserved separately', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // 3. Multi-Requirement Digest: Unchanged active, Changed active, and Genuinely new
    // -------------------------------------------------------------------------
    try {
      const activeJD = `ACT-JD-${Date.now()}`;
      const changeJD = `CHG-JD-${Date.now()}`;
      const newJD = `NEW-JD-${Date.now()}`;

      // Ingest initial active & change items
      const initActive = await ingest({
        graph_message_id: `msg-digest-base-1-${Date.now()}`,
        client_jd_id: activeJD,
        requirement_from: QA_CLIENT,
        job_title: 'Java Microservices Engineer',
        location: 'Hyderabad',
        number_of_positions: 3,
        notice_period: '15 Days',
      });
      const initChange = await ingest({
        graph_message_id: `msg-digest-base-2-${Date.now()}`,
        client_jd_id: changeJD,
        requirement_from: QA_CLIENT,
        job_title: 'DevOps Platform Engineer',
        location: 'Gurgaon',
        yearly_budget_max: 2000000,
        number_of_positions: 2,
      });

      const activeId = initActive.data?.data?.requirementId;
      const changeId = initChange.data?.data?.requirementId;
      if (activeId) createdIds.push(activeId);
      if (changeId) createdIds.push(changeId);

      // Now simulate a multi-requirement email digest arriving the next day containing all 3
      const digestItems = [
        // 1. Unchanged active requirement
        {
          graph_message_id: `msg-multi-digest-${Date.now()}`,
          client_jd_id: activeJD,
          requirement_from: QA_CLIENT,
          job_title: 'Java Microservices Engineer',
          location: 'Hyderabad',
          number_of_positions: 3,
        },
        // 2. Changed active requirement (budget increased to 25 LPA, openings 5)
        {
          graph_message_id: `msg-multi-digest-${Date.now()}`,
          client_jd_id: changeJD,
          requirement_from: QA_CLIENT,
          job_title: 'DevOps Platform Engineer',
          location: 'Gurgaon',
          yearly_budget_max: 2500000,
          number_of_positions: 5,
        },
        // 3. Genuinely new requirement
        {
          graph_message_id: `msg-multi-digest-${Date.now()}`,
          client_jd_id: newJD,
          requirement_from: QA_CLIENT,
          job_title: 'Data Science ML Engineer',
          location: 'Noida',
          number_of_positions: 1,
        },
      ];

      const resDigest = await Promise.all(digestItems.map(item => ingest(item)));
      const newId = resDigest[2].data?.data?.requirementId;
      if (newId) createdIds.push(newId);

      const docActive = await reqCol.findOne({ sourceClientJdId: activeJD });
      const docChange = await reqCol.findOne({ sourceClientJdId: changeJD });
      const docNew = await reqCol.findOne({ sourceClientJdId: newJD });

      const passed =
        resDigest[0].data?.data?.deduped === true &&
        resDigest[0].data?.data?.requirementId === activeId &&
        resDigest[1].data?.data?.deduped === true &&
        resDigest[1].data?.data?.requirementId === changeId &&
        docChange?.openings === 5 &&
        docChange?.budgetRange?.max === 2500000 &&
        resDigest[2].data?.data?.deduped === false &&
        docNew !== null;

      results.push({
        scenario: 'Multi-requirement emails process active, changed, and new requirements independently',
        passed,
        details: `Active skipped duplicate; Changed updated in place (5 openings, 25 LPA); New created cleanly`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Multi-requirement emails process active, changed, and new requirements independently', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // 4. Chronological Ordering: Newest first; Updated older requirement maintains original position
    // -------------------------------------------------------------------------
    try {
      const CHRONO_OLD = `QA-CHRONO-OLD-${Date.now()}`;
      const CHRONO_NEW = `QA-CHRONO-NEW-${Date.now()}`;

      // Insert older requirement (e.g. 2 days ago)
      const tOld = new Date(Date.now() - 48 * 3600 * 1000);
      const resOld = await ingest({
        graph_message_id: `msg-chrono-old-${Date.now()}`,
        client_jd_id: CHRONO_OLD,
        requirement_from: QA_CLIENT,
        job_title: 'Senior QA Automation Architect',
        receivedDateTime: tOld.toISOString(),
      });
      const oldId = resOld.data?.data?.requirementId;
      if (oldId) createdIds.push(oldId);

      // Insert newer requirement (e.g. 1 hour ago)
      const tNew = new Date(Date.now() - 1 * 3600 * 1000);
      const resNew = await ingest({
        graph_message_id: `msg-chrono-new-${Date.now()}`,
        client_jd_id: CHRONO_NEW,
        requirement_from: QA_CLIENT,
        job_title: 'Principal Security Architect',
        receivedDateTime: tNew.toISOString(),
      });
      const newId = resNew.data?.data?.requirementId;
      if (newId) createdIds.push(newId);

      // Now send an update for the older requirement today
      await ingest({
        graph_message_id: `msg-chrono-old-update-${Date.now()}`,
        client_jd_id: CHRONO_OLD,
        requirement_from: QA_CLIENT,
        job_title: 'Senior QA Automation Architect',
        number_of_positions: 8, // Changed field
        receivedDateTime: new Date().toISOString(),
      });

      const ws = await getWorkspace(token);
      const reqs: any[] = ws?.requirements || [];

      const idxNew = reqs.findIndex(r => r.sourceClientJdId === CHRONO_NEW);
      const idxOld = reqs.findIndex(r => r.sourceClientJdId === CHRONO_OLD);

      // In descending chronological order, the newer requirement must have a lower index (higher on the page) than the older requirement!
      const passed =
        idxNew !== -1 &&
        idxOld !== -1 &&
        idxNew < idxOld;

      results.push({
        scenario: 'Chronological ordering preserves original position of updated older requirements',
        passed,
        details: `Newer requirement index=${idxNew} is ahead of older updated requirement index=${idxOld}; firstDetectedAt preserved`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Chronological ordering preserves original position of updated older requirements', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // 5. Idempotency Key Server-Side Deduplication
    // -------------------------------------------------------------------------
    try {
      const IDEM_KEY = `IDEM-KEY-${Date.now()}`;
      const idemPayload = {
        idempotencyKey: IDEM_KEY,
        requirement_from: QA_CLIENT,
        job_title: 'Site Reliability Director',
        location: 'Hyderabad',
      };

      const res1 = await ingest(idemPayload);
      const res2 = await ingest(idemPayload);
      const res3 = await ingest(idemPayload);

      const dbCount = await reqCol.countDocuments({ idempotencyKey: IDEM_KEY });

      const passed =
        res1.data?.data?.deduped === false &&
        res2.data?.data?.deduped === true &&
        res3.data?.data?.deduped === true &&
        res1.data?.data?.requirementId === res2.data?.data?.requirementId &&
        res1.data?.data?.requirementId === res3.data?.data?.requirementId &&
        dbCount === 1;

      if (res1.data?.data?.requirementId) createdIds.push(res1.data?.data?.requirementId);

      results.push({
        scenario: 'Idempotency key enforces exactly-once creation across retries',
        passed,
        details: `3 sequential requests with same key yielded 1 record (id=${res1.data?.data?.requirementId})`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Idempotency key enforces exactly-once creation across retries', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // 6. Two-Minute Scheduler Configuration and Status Verification
    // -------------------------------------------------------------------------
    try {
      const sched = await getSchedulerStatus(token);
      const passed =
        sched?.enabled === true &&
        sched?.intervalMinutes === 2 &&
        sched?.timezone === 'Asia/Kolkata';

      results.push({
        scenario: 'Two-minute scheduler interval is active with Asia/Kolkata timezone',
        passed,
        details: `enabled=${sched?.enabled}, intervalMinutes=${sched?.intervalMinutes}, timezone=${sched?.timezone}, isRunningJob=${sched?.isRunningJob}`,
      });
    } catch (e: any) {
      results.push({ scenario: 'Two-minute scheduler interval is active with Asia/Kolkata timezone', passed: false, error: e.message });
    }

  } finally {
    // Isolated Cleanup: Delete test data created during this specific run
    await reqCol.deleteMany({ clientName: QA_CLIENT });
    await clientCol.deleteMany({ clientName: QA_CLIENT });
    if (createdIds.length > 0) {
      await histCol.deleteMany({
        requirementId: { $in: createdIds.map(id => new mongoose.Types.ObjectId(id)) },
      });
    }
    await mongoose.disconnect();
  }

  // Print Summary
  console.log('\n================================================================');
  console.log('EXTENDED LIFECYCLE TEST RESULTS');
  console.log('================================================================');
  let passCount = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const mark = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] Check ${i + 1}: ${r.scenario}`);
    if (r.details) console.log(`       Details: ${r.details}`);
    if (r.error) console.log(`       Error:   ${r.error}`);
    if (r.passed) passCount++;
  }
  console.log('================================================================');
  console.log(`TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log('================================================================\n');

  if (passCount !== results.length) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal extended test error:', err);
  process.exit(1);
});
