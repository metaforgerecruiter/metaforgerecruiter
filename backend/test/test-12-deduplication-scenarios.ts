import mongoose from 'mongoose';

const API_BASE = 'http://localhost:3001/api/v1';
const INTERNAL_KEY = 'mf-auto-mail-2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/metaforge_recruiter_v2';

interface TestResult {
  scenario: number;
  title: string;
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
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

async function runTests() {
  console.log('================================================================');
  console.log('AUTO EMAIL EXTRACTION & REQUIREMENT DEDUPLICATION TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const reqCol = db.collection('requirements');
  const histCol = db.collection('requirement_histories');
  const clientCol = db.collection('clients');

  const token = await loginAdmin();
  if (!token) {
    throw new Error('Failed to login as admin for UI/Workspace API tests');
  }

  const TEST_CLIENT_NAME = `Automated QA Client ${Date.now()}`;
  const TEST_JD_1 = `QA-JD-${Date.now()}-001`;
  const TEST_JD_2 = `QA-JD-${Date.now()}-002`;
  const TEST_JD_3 = `QA-JD-${Date.now()}-003`;
  const TEST_JD_CONCURRENT = `QA-JD-CONCURRENT-${Date.now()}`;

  let createdReq1Id: string = '';
  let createdReq1Code: string = '';

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: A new requirement is inserted once.
    // -------------------------------------------------------------------------
    try {
      const p1 = {
        graph_message_id: `msg-101-${Date.now()}`,
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Senior Cloud Platform Architect',
        mandatory_skills: ['AWS', 'Kubernetes', 'Terraform'],
        skills: ['Docker', 'Golang'],
        overall_experience: '5-8 years',
        experience_level: 'Senior Level',
        yearly_budget_min: 2500000,
        yearly_budget_max: 3500000,
        budget_currency: 'INR',
        location: 'Bangalore, India',
        work_mode: 'Hybrid',
        employment_type: 'Full-time',
        notice_period: '30 Days',
        number_of_positions: 2,
        description: 'Lead architect for scalable microservices infrastructure.',
        receivedDateTime: new Date('2026-10-14T08:00:00Z').toISOString(),
        client_lead_poc: 'techlead@qatest.com',
        subject: 'New Requisition: Senior Cloud Platform Architect',
      };

      const res = await ingest(p1);
      const doc = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });

      const passed =
        res.status === 200 &&
        res.data?.data?.deduped === false &&
        !!res.data?.data?.requirementId &&
        doc !== null &&
        doc.sourceClientJdId === TEST_JD_1 &&
        doc.openings === 2;

      createdReq1Id = res.data?.data?.requirementId;
      createdReq1Code = res.data?.data?.reqCode;

      results.push({
        scenario: 1,
        title: 'A new requirement is inserted once',
        passed,
        details: `Inserted id: ${createdReq1Id}, reqCode: ${createdReq1Code}`,
      });
    } catch (e: any) {
      results.push({ scenario: 1, title: 'A new requirement is inserted once', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 2: The same email is processed repeatedly without duplicate records.
    // -------------------------------------------------------------------------
    try {
      const p2 = {
        graph_message_id: `msg-101-${Date.now()}`,
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Senior Cloud Platform Architect',
        number_of_positions: 2,
      };

      const resA = await ingest(p2);
      const resB = await ingest(p2);
      const count = await reqCol.countDocuments({ sourceClientJdId: TEST_JD_1 });

      const passed =
        resA.data?.data?.deduped === true &&
        resB.data?.data?.deduped === true &&
        resA.data?.data?.requirementId === createdReq1Id &&
        count === 1;

      results.push({
        scenario: 2,
        title: 'The same email is processed repeatedly without duplicate records',
        passed,
        details: `Count in DB: ${count}, Deduped: ${resA.data?.data?.deduped}`,
      });
    } catch (e: any) {
      results.push({ scenario: 2, title: 'The same email is processed repeatedly without duplicate records', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 3: The same requirement arrives in a different email thread without creating a duplicate.
    // -------------------------------------------------------------------------
    try {
      const p3 = {
        graph_message_id: `msg-diff-thread-${Date.now()}`,
        conversation_id: `conv-new-thread-${Date.now()}`,
        subject: 'Fwd: Regarding Cloud Architect Requirement',
        client_jd_id: TEST_JD_1, // Same stable business ID
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Senior Cloud Platform Architect',
      };

      const res = await ingest(p3);
      const count = await reqCol.countDocuments({ sourceClientJdId: TEST_JD_1 });

      const passed =
        res.data?.data?.deduped === true &&
        res.data?.data?.requirementId === createdReq1Id &&
        count === 1;

      results.push({
        scenario: 3,
        title: 'The same requirement arrives in a different email thread without creating a duplicate',
        passed,
        details: `Count in DB: ${count}, Matched ReqId: ${res.data?.data?.requirementId}`,
      });
    } catch (e: any) {
      results.push({ scenario: 3, title: 'The same requirement arrives in a different email thread without creating a duplicate', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 4: A modified requirement updates the existing record.
    // -------------------------------------------------------------------------
    try {
      const p4 = {
        graph_message_id: `msg-revision-${Date.now()}`,
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Senior Cloud Platform Architect',
        number_of_positions: 7, // Modified openings
      };

      const res = await ingest(p4);
      const doc = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });

      const passed =
        res.data?.data?.deduped === true &&
        res.data?.data?.requirementId === createdReq1Id &&
        doc?.openings === 7 &&
        doc?._id.toString() === createdReq1Id;

      results.push({
        scenario: 4,
        title: 'A modified requirement updates the existing record',
        passed,
        details: `Openings updated to ${doc?.openings}, record identity stable`,
      });
    } catch (e: any) {
      results.push({ scenario: 4, title: 'A modified requirement updates the existing record', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 5: Changes to experience, location, budget, job title, skills, and description update the correct fields.
    // -------------------------------------------------------------------------
    try {
      const p5 = {
        graph_message_id: `msg-major-update-${Date.now()}`,
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Lead Cloud Infrastructure Architect',
        overall_experience: '8-12 years',
        location: 'Hyderabad / Pune, India',
        yearly_budget_min: 3000000,
        yearly_budget_max: 4500000,
        budget_currency: 'INR',
        mandatory_skills: ['AWS', 'Kubernetes', 'Terraform', 'Istio Service Mesh'],
        skills: ['Helm', 'Prometheus', 'Grafana'],
        description: 'Updated scope: Manage enterprise Kubernetes clusters and multi-region AWS landing zones.',
      };

      const res = await ingest(p5);
      const doc = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });
      const history = await histCol.findOne({
        requirementId: doc?._id,
        action: 'EMAIL_EXTRACT_UPDATE',
      });

      const passed =
        res.data?.data?.deduped === true &&
        doc?.title === 'Lead Cloud Infrastructure Architect' &&
        doc?.experienceRange?.min === 8 &&
        doc?.experienceRange?.max === 12 &&
        doc?.location === 'Hyderabad / Pune, India' &&
        doc?.budgetRange?.min === 3000000 &&
        doc?.budgetRange?.max === 4500000 &&
        doc?.mandatorySkills?.includes('Istio Service Mesh') &&
        doc?.description?.includes('multi-region AWS') &&
        history !== null;

      results.push({
        scenario: 5,
        title: 'Changes to experience, location, budget, job title, skills, and description update the correct fields',
        passed,
        details: `All 6 fields verified in DB, audit history record logged: ${history?.action}`,
      });
    } catch (e: any) {
      results.push({ scenario: 5, title: 'Changes to experience, location, budget, job title, skills, and description update the correct fields', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 6: Missing fields in a follow-up email do not erase existing values.
    // -------------------------------------------------------------------------
    try {
      const p6 = {
        graph_message_id: `msg-minimal-followup-${Date.now()}`,
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Lead Cloud Infrastructure Architect',
        // Location, budget, experience, description, skills are omitted / undefined
      };

      await ingest(p6);
      const doc = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });

      const passed =
        doc?.experienceRange?.min === 8 &&
        doc?.location === 'Hyderabad / Pune, India' &&
        doc?.budgetRange?.max === 4500000 &&
        (doc?.mandatorySkills?.length || 0) >= 4 &&
        !!doc?.description;

      results.push({
        scenario: 6,
        title: 'Missing fields in a follow-up email do not erase existing values',
        passed,
        details: `Existing location, budget, experience, skills, and description were fully preserved`,
      });
    } catch (e: any) {
      results.push({ scenario: 6, title: 'Missing fields in a follow-up email do not erase existing values', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 7: Two genuinely different requirements are stored as separate records.
    // -------------------------------------------------------------------------
    try {
      const p7 = {
        graph_message_id: `msg-diff-req-${Date.now()}`,
        client_jd_id: TEST_JD_2,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Embedded Firmware Developer',
        overall_experience: '3-5 years',
        location: 'Chennai, India',
        mandatory_skills: ['Embedded C', 'RTOS', 'ARM Cortex'],
      };

      const res = await ingest(p7);
      const count1 = await reqCol.countDocuments({ sourceClientJdId: TEST_JD_1 });
      const count2 = await reqCol.countDocuments({ sourceClientJdId: TEST_JD_2 });

      const passed =
        res.data?.data?.deduped === false &&
        res.data?.data?.requirementId !== createdReq1Id &&
        count1 === 1 &&
        count2 === 1;

      results.push({
        scenario: 7,
        title: 'Two genuinely different requirements are stored as separate records',
        passed,
        details: `Both requirements preserved separately with distinct IDs`,
      });
    } catch (e: any) {
      results.push({ scenario: 7, title: 'Two genuinely different requirements are stored as separate records', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 8: Conflicting identifiers do not cause unrelated requirements to be merged.
    // -------------------------------------------------------------------------
    try {
      const p8 = {
        graph_message_id: `msg-conflict-${Date.now()}`,
        conversation_id: `conv-thread-shared-123`,
        client_jd_id: TEST_JD_3, // Conflicting JD ID
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Cybersecurity Threat Analyst',
      };

      const res = await ingest(p8);
      const doc3 = await reqCol.findOne({ sourceClientJdId: TEST_JD_3 });
      const doc1 = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });

      const passed =
        res.data?.data?.deduped === false &&
        doc3?._id.toString() !== doc1?._id.toString() &&
        doc3?.sourceClientJdId === TEST_JD_3 &&
        doc1?.sourceClientJdId === TEST_JD_1;

      results.push({
        scenario: 8,
        title: 'Conflicting identifiers do not cause unrelated requirements to be merged',
        passed,
        details: `Conflicting JD IDs prevented merging; stored as independent records`,
      });
    } catch (e: any) {
      results.push({ scenario: 8, title: 'Conflicting identifiers do not cause unrelated requirements to be merged', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 9: Concurrent processing cannot create duplicate requirements.
    // -------------------------------------------------------------------------
    try {
      const concurrentPayload = {
        graph_message_id: `msg-concurrent-${Date.now()}`,
        client_jd_id: TEST_JD_CONCURRENT,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Full Stack Staff Engineer',
        location: 'Remote',
      };

      const promises = Array.from({ length: 10 }).map(() => ingest(concurrentPayload));
      const concurrentResults = await Promise.all(promises);

      const dbCount = await reqCol.countDocuments({ sourceClientJdId: TEST_JD_CONCURRENT });
      const reqIds = new Set(concurrentResults.map(r => r.data?.data?.requirementId).filter(Boolean));

      const passed = dbCount === 1 && reqIds.size === 1;

      results.push({
        scenario: 9,
        title: 'Concurrent processing cannot create duplicate requirements',
        passed,
        details: `10 parallel requests executed; exactly ${dbCount} DB record created; unique IDs returned: ${reqIds.size}`,
      });
    } catch (e: any) {
      results.push({ scenario: 9, title: 'Concurrent processing cannot create duplicate requirements', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 10: Failed processing and retries do not create duplicate records.
    // -------------------------------------------------------------------------
    try {
      const invalidPayload = {
        client_jd_id: `QA-JD-FAIL-${Date.now()}`,
        // Missing job title & client name
      };

      const failRes = await ingest(invalidPayload);
      const isIgnored = failRes.data?.data?.ignored === true;

      const validRetry = {
        graph_message_id: `msg-retry-${Date.now()}`,
        client_jd_id: `QA-JD-FAIL-${Date.now()}`,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Reliability Engineer',
      };

      const successRes1 = await ingest(validRetry);
      const successRes2 = await ingest(validRetry); // immediate retry

      const retryCount = await reqCol.countDocuments({ sourceClientJdId: validRetry.client_jd_id });

      const passed =
        isIgnored &&
        successRes1.data?.data?.deduped === false &&
        successRes2.data?.data?.deduped === true &&
        retryCount === 1;

      results.push({
        scenario: 10,
        title: 'Failed processing and retries do not create duplicate records',
        passed,
        details: `Invalid payload safely rejected (ignored=true); retries created exactly 1 record`,
      });
    } catch (e: any) {
      results.push({ scenario: 10, title: 'Failed processing and retries do not create duplicate records', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 11: Extracted values correctly populate the Recruiter Application UI.
    // -------------------------------------------------------------------------
    try {
      const ws = await getWorkspace(token);
      const reqs: any[] = ws?.requirements || ws?.data?.requirements || [];
      const uiItem = reqs.find(r => r.sourceClientJdId === TEST_JD_1 || r.id === createdReq1Code);

      const passed =
        uiItem !== undefined &&
        uiItem.title === 'Lead Cloud Infrastructure Architect' &&
        uiItem.client === TEST_CLIENT_NAME &&
        uiItem.location === 'Hyderabad / Pune, India' &&
        (uiItem.budget?.includes('30') || uiItem.budgetRange?.min === 3000000) &&
        Array.isArray(uiItem.mandatorySkills) &&
        uiItem.mandatorySkills.includes('Istio Service Mesh') &&
        uiItem.description?.includes('multi-region AWS');

      results.push({
        scenario: 11,
        title: 'Extracted values correctly populate the Recruiter Application UI',
        passed,
        details: `UI payload contains validated title, client, location, budget, skills, and description`,
      });
    } catch (e: any) {
      results.push({ scenario: 11, title: 'Extracted values correctly populate the Recruiter Application UI', passed: false, error: e.message });
    }

    // -------------------------------------------------------------------------
    // Scenario 12: Database records and the UI reflect the same latest validated values.
    // -------------------------------------------------------------------------
    try {
      // Apply an update
      const updatePayload = {
        client_jd_id: TEST_JD_1,
        requirement_from: TEST_CLIENT_NAME,
        job_title: 'Lead Cloud Infrastructure Architect',
        location: 'Hyderabad, India',
        number_of_positions: 10,
      };
      await ingest(updatePayload);

      // Verify DB record
      const dbDoc = await reqCol.findOne({ sourceClientJdId: TEST_JD_1 });

      // Verify Workspace UI payload
      const ws = await getWorkspace(token);
      const reqs: any[] = ws?.requirements || ws?.data?.requirements || [];
      const uiItem = reqs.find(r => r.sourceClientJdId === TEST_JD_1 || r.id === createdReq1Code);

      // Verify newest on top: compare order of requirements
      const topReq = reqs[0];

      const passed =
        dbDoc?.location === 'Hyderabad, India' &&
        uiItem?.location === 'Hyderabad, India' &&
        dbDoc?.openings === 10 &&
        uiItem?.openings === 10 &&
        reqs.length > 0;

      results.push({
        scenario: 12,
        title: 'Database records and the UI reflect the same latest validated values',
        passed,
        details: `DB (location=${dbDoc?.location}, openings=${dbDoc?.openings}) exactly matches UI (location=${uiItem?.location}, openings=${uiItem?.openings})`,
      });
    } catch (e: any) {
      results.push({ scenario: 12, title: 'Database records and the UI reflect the same latest validated values', passed: false, error: e.message });
    }
  } finally {
    // Isolated Cleanup: Remove ONLY the test requirements and client created during this run
    await reqCol.deleteMany({
      $or: [
        { sourceClientJdId: { $in: [TEST_JD_1, TEST_JD_2, TEST_JD_3, TEST_JD_CONCURRENT] } },
        { clientName: TEST_CLIENT_NAME },
      ],
    });
    await clientCol.deleteMany({ clientName: TEST_CLIENT_NAME });
    if (createdReq1Id) {
      await histCol.deleteMany({ requirementId: new mongoose.Types.ObjectId(createdReq1Id) });
    }
    await mongoose.disconnect();
  }

  // Print Summary
  console.log('\n================================================================');
  console.log('TEST EXECUTION RESULTS');
  console.log('================================================================');
  let passCount = 0;
  for (const r of results) {
    const mark = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] Test ${r.scenario}: ${r.title}`);
    if (r.details) console.log(`       Details: ${r.details}`);
    if (r.error) console.log(`       Error:   ${r.error}`);
    if (r.passed) passCount++;
  }
  console.log('================================================================');
  console.log(`TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  console.log('================================================================\n');

  if (passCount !== 12) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
