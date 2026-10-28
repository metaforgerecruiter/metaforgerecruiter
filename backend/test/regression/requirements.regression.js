/*
 * Requirement ingestion regression suite (dedupe, IDs, status updates, ordering, idempotency).
 *
 * Runs against an ISOLATED test database and a separate backend instance:
 *   - database: <MONGODB_DB_NAME>_test (dropped and re-seeded at start; refuses any name not ending in "_test")
 *   - backend:  spawned on TEST_PORT (default 3101) with the mail scheduler disabled
 * Production data, the live backend and the mailbox are never touched.
 *
 * Usage (from backend/):  node test/regression/requirements.regression.js
 * Leaves the test backend running when KEEP_TEST_BACKEND=1 (used by the Python E2E tests).
 */
require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const TEST_DB = process.env.TEST_DB_NAME || `${process.env.MONGODB_DB_NAME}_test`;
const PORT = Number(process.env.TEST_PORT || 3101);
const BASE = `http://127.0.0.1:${PORT}/api/v1`;
const KEY = String(process.env.INTERNAL_AUTOMATION_API_KEY || 'test-automation-key');
if (!TEST_DB.endsWith('_test')) throw new Error(`Refusing to run against non-test database "${TEST_DB}"`);

const results = [];
async function check(id, name, fn) {
  try {
    await fn();
    results.push({ id, name, ok: true });
    console.log(`PASS ${id}. ${name}`);
  } catch (e) {
    results.push({ id, name, ok: false, err: e.message });
    console.log(`FAIL ${id}. ${name}\n      ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

let token = '';
async function ingest(payload) {
  const r = await fetch(`${BASE}/requirements/ingest-email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-api-key': KEY },
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => ({}));
  if (r.status >= 400) throw new Error(`ingest HTTP ${r.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return body.data || {};
}
async function api(pathname) {
  const r = await fetch(`${BASE}${pathname}`, { headers: { authorization: `Bearer ${token}` } });
  const body = await r.json().catch(() => ({}));
  if (r.status >= 400) throw new Error(`GET ${pathname} HTTP ${r.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return body && body.data !== undefined ? body.data : body;
}

// Sanitized fixtures: fictitious people; client domains are the configured trusted ones.
let seq = 0;
function req(overrides = {}) {
  seq += 1;
  return {
    job_title: `Test Role ${seq}`,
    requirement_from: 'Accenture',
    client_jd_id: `9${String(10000 + seq)}-1`,
    location: 'Bangalore',
    overall_experience: '5 Yrs',
    monthly_budget: '2.10 Lakhs',
    mandatory_skills: ['SAP FI'],
    receivedDateTime: '2030-01-14T05:00:00Z',
    graphMessageId: `test-msg-${seq}`,
    idempotencyKey: `idem-${seq}`,
    source_sender_email: 'demands@iexcel.co.in',
    subject: `Open demands batch ${seq}`,
    ...overrides,
  };
}

async function waitForBackend(proc) {
  for (let i = 0; i < 120; i++) {
    if (proc.exitCode !== null) throw new Error(`test backend exited with code ${proc.exitCode}`);
    try {
      const r = await fetch(`${BASE}/requirements`);
      if (r.status === 401 || r.status === 200) return;
    } catch {}
    await new Promise((res) => setTimeout(res, 1000));
  }
  throw new Error('test backend did not start');
}

(async () => {
  // 1. Fresh isolated database
  await mongoose.connect(process.env.MONGODB_URI, { dbName: TEST_DB });
  await mongoose.connection.db.dropDatabase();
  const db = mongoose.connection.db;
  const reqs = db.collection('requirements');

  // 2. Isolated backend instance
  const backendDir = path.resolve(__dirname, '..', '..');
  const proc = spawn(process.execPath, [require.resolve('ts-node/dist/bin.js', { paths: [backendDir] }), '--transpile-only', 'src/main.ts'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      MONGODB_DB_NAME: TEST_DB,
      MAIL_EXTRACTION_SCHEDULE_ENABLED: 'false',
      SEED_ON_START: 'true',
      INTERNAL_AUTOMATION_API_KEY: KEY,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let backendLog = '';
  proc.stdout.on('data', (c) => (backendLog = (backendLog + c).slice(-20000)));
  proc.stderr.on('data', (c) => (backendLog = (backendLog + c).slice(-20000)));
  const stop = () => {
    if (process.env.KEEP_TEST_BACKEND !== '1') proc.kill();
  };
  try {
    await waitForBackend(proc);
    // Mongoose builds indexes in the background after start-up; the uniqueness tests are only
    // meaningful once the (orgId, reqCode, deletedAt) unique index exists, as it does in production.
    for (let i = 0; i < 60; i++) {
      const idx = await reqs.indexes().catch(() => []);
      if (idx.some((x) => x.unique && x.key.reqCode)) break;
      if (i === 59) throw new Error('unique reqCode index was never created in the test database');
      await new Promise((r) => setTimeout(r, 1000));
    }
    const admin = await db.collection('users').findOne({ orgId: { $ne: null }, deletedAt: null, role: { $in: ['superadmin', 'admin'] } });
    assert(admin, 'seeded admin user not found in test database');
    token = jwt.sign(
      { sub: String(admin._id), userId: String(admin.userId || admin._id), email: admin.email, role: admin.role, orgId: String(admin.orgId) },
      process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set'); })(),
      { expiresIn: '1h' },
    );
    const live = (f = {}) => reqs.countDocuments({ deletedAt: null, ...f });

    // ---- IDs -------------------------------------------------------------------------
    let a1, a2, b1;
    await check(1, 'New requirement creates exactly one record with daily ID YYYY-MM-DD-001', async () => {
      const before = await live();
      a1 = await ingest(req({ receivedDateTime: '2030-01-14T04:00:00Z' })); // 09:30 IST, 14 Jan
      eq(await live(), before + 1, 'record count');
      eq(a1.reqCode, '2030-01-14-001', 'reqCode');
      const doc = await reqs.findOne({ reqCode: a1.reqCode });
      assert(doc.sourceClientJdId && !doc.reqCode.includes('('), 'client reference stored separately, not inside reqCode');
    });
    await check(2, 'Second new requirement the same day gets the next sequence', async () => {
      a2 = await ingest(req({ receivedDateTime: '2030-01-14T06:00:00Z' }));
      eq(a2.reqCode, '2030-01-14-002', 'reqCode');
    });
    await check(3, 'First new requirement the next day starts at 001 (IST day boundary)', async () => {
      b1 = await ingest(req({ receivedDateTime: '2030-01-14T19:00:00Z' })); // 00:30 IST on 15 Jan
      eq(b1.reqCode, '2030-01-15-001', 'reqCode');
    });

    // ---- Ordering --------------------------------------------------------------------
    await check(4, 'New requirements appear at the top, newest creation first', async () => {
      const list = await api('/requirements');
      const top = list.slice(0, 3).map((r) => r.reqCode);
      eq(top, ['2030-01-15-001', '2030-01-14-002', '2030-01-14-001'], 'API order');
    });

    // ---- Source filtering ------------------------------------------------------------
    await check(5, 'Internal @metaforgeit.com sender cannot create a requirement', async () => {
      const before = await live();
      const res = await ingest(req({ source_sender_email: 'someone@metaforgeit.com' }));
      assert(res.ignored, 'expected ignored');
      eq(await live(), before, 'record count');
    });
    await check(6, 'Internal forward carrying client text cannot create or update a requirement', async () => {
      const before = await live();
      const doc = await reqs.findOne({ reqCode: a1.reqCode });
      const res = await ingest(req({ source_sender_email: 'ops@metaforgeit.com', client_jd_id: doc.sourceClientJdId, monthly_budget: '9.99 Lakhs' }));
      assert(res.ignored, 'expected ignored');
      eq(await live(), before, 'record count');
      const after = await reqs.findOne({ reqCode: a1.reqCode });
      eq(after.budgetText, doc.budgetText, 'budget unchanged');
    });

    // ---- In-place updates ------------------------------------------------------------
    await check(7, 'Verified client update changes fields in place without a new record', async () => {
      const before = await live();
      const doc = await reqs.findOne({ reqCode: a1.reqCode });
      const res = await ingest(req({
        client_jd_id: doc.sourceClientJdId, job_title: doc.title, monthly_budget: '2.50 Lakhs', overall_experience: '7 Yrs',
        receivedDateTime: '2030-01-16T05:00:00Z', subject: 'Re: updated demand',
      }));
      eq(await live(), before, 'record count');
      eq(res.reqCode, a1.reqCode, 'same Requirement ID');
      const after = await reqs.findOne({ reqCode: a1.reqCode });
      eq(after.budgetText, '2.50 Lakhs', 'budget updated');
      eq(after.experienceRange.min, 7, 'experience updated');
    });
    await check(8, 'Hold, stop-sourcing, reopen and resume update the existing record only', async () => {
      const before = await live();
      const doc = await reqs.findOne({ reqCode: a2.reqCode });
      const base = { status_update_only: true, requirement_from: 'Accenture', client_jd_id: doc.sourceClientJdId, source_sender_email: 'demands@iexcel.co.in', subject: 'Re: demand', receivedDateTime: '2030-01-17T05:00:00Z' };
      let r = await ingest({ ...base, job_status: 'hold', status_reason: 'hold' });
      assert(r.matched && r.changed, 'hold matched'); eq((await reqs.findOne({ _id: doc._id })).status, 'On Hold', 'status after hold');
      r = await ingest({ ...base, job_status: 'open', status_reason: 'reopen' });
      eq((await reqs.findOne({ _id: doc._id })).status, 'Open', 'status after reopen');
      r = await ingest({ ...base, job_status: 'hold', status_reason: 'stop_sourcing' });
      eq((await reqs.findOne({ _id: doc._id })).status, 'On Hold', 'status after stop sourcing');
      r = await ingest({ ...base, job_status: 'open', status_reason: 'resume_sourcing' });
      eq((await reqs.findOne({ _id: doc._id })).status, 'Open', 'status after resume');
      eq(await live(), before, 'record count');
      const unmatched = await ingest({ ...base, client_jd_id: '999999-9', job_status: 'hold' });
      assert(unmatched.matched === false, 'unknown requirement is reported unmatched, not created');
      eq(await live(), before, 'record count after unmatched status');
    });
    await check(9, 'Repeated identical emails do not create duplicates', async () => {
      const p = req({ receivedDateTime: '2030-01-18T05:00:00Z' });
      const first = await ingest(p);
      const before = await live();
      for (let i = 0; i < 3; i++) eq((await ingest(p)).reqCode, first.reqCode, 'same record on repeat');
      eq(await live(), before, 'record count');
    });
    await check(10, 'Updates preserve Requirement ID, creation timestamp and list position', async () => {
      const listBefore = (await api('/requirements')).map((r) => r.reqCode);
      const doc = await reqs.findOne({ reqCode: '2030-01-14-001' });
      await ingest(req({ client_jd_id: doc.sourceClientJdId, job_title: doc.title, monthly_budget: '3.00 Lakhs', receivedDateTime: '2030-02-01T05:00:00Z' }));
      await ingest({ status_update_only: true, requirement_from: 'Accenture', client_jd_id: doc.sourceClientJdId, job_status: 'hold', source_sender_email: 'demands@iexcel.co.in', receivedDateTime: '2030-02-02T05:00:00Z' });
      const after = await reqs.findOne({ _id: doc._id });
      eq(after.reqCode, doc.reqCode, 'reqCode');
      eq(new Date(after.firstDetectedAt).toISOString(), new Date(doc.firstDetectedAt).toISOString(), 'firstDetectedAt');
      eq(new Date(after.emailArrivedTime).toISOString(), new Date(doc.emailArrivedTime).toISOString(), 'emailArrivedTime');
      eq((await api('/requirements')).map((r) => r.reqCode), listBefore, 'list order unchanged by updates');
    });
    await check(11, 'Distinct requirements with similar descriptions stay separate', async () => {
      const before = await live();
      const common = { job_title: 'SAP FI Consultant', mandatory_skills: ['SAP FI', 'S/4HANA'], location: 'Pune', receivedDateTime: '2030-01-19T05:00:00Z' };
      const x = await ingest(req({ ...common, client_jd_id: '880001-1' }));
      const y = await ingest(req({ ...common, client_jd_id: '880002-1' }));
      assert(x.reqCode !== y.reqCode, 'different records');
      eq(await live(), before + 2, 'record count');
    });

    await check('11b', 'Look-alike without client ID from a different email is flagged, never merged', async () => {
      const base = { client_jd_id: null, requirement_from: 'LTTS', source_sender_email: 'lead@ltts.com', job_title: 'Application Engineer', location: 'Mumbai', mandatory_skills: ['PLC', 'SCADA', 'HMI'], overall_experience: '3-7 years', receivedDateTime: '2030-01-24T05:00:00Z' };
      const us = await ingest(req({ ...base, subject: 'TPC - Requirement - Application Engineer - US, Mumbai' }));
      const before = await live();
      const usDoc = await reqs.findOne({ reqCode: us.reqCode });
      const uk = await ingest(req({ ...base, subject: 'TPC - Requirement - Application Engineer - UK, Mumbai', receivedDateTime: '2030-01-24T05:02:00Z' }));
      assert(uk.needsReview && uk.ignored, 'ambiguous look-alike reported for review');
      eq(await live(), before, 'no record created');
      const usAfter = await reqs.findOne({ _id: usDoc._id });
      eq(usAfter.sourceSubject, usDoc.sourceSubject, 'existing record untouched');
      const again = await ingest(req({ ...base, subject: 'RE: TPC - Requirement - Application Engineer - US, Mumbai', monthly_budget: '1.20 Lakhs', receivedDateTime: '2030-01-25T05:00:00Z' }));
      eq(again.reqCode, us.reqCode, 'same subject still updates the same record');
    });

    // ---- Concurrency & retries -------------------------------------------------------
    await check(12, 'Concurrent creates get unique, gap-free IDs; concurrent duplicates make one record', async () => {
      const day = '2030-01-20T05:00:00Z';
      const created = await Promise.all(Array.from({ length: 10 }, () => ingest(req({ receivedDateTime: day }))));
      const codes = created.map((c) => c.reqCode).sort();
      eq(codes, Array.from({ length: 10 }, (_, i) => `2030-01-20-${String(i + 1).padStart(3, '0')}`), 'IDs');
      const dup = req({ receivedDateTime: '2030-01-21T05:00:00Z' });
      const before = await live();
      const same = await Promise.all(Array.from({ length: 5 }, (_, i) => ingest({ ...dup, idempotencyKey: `${dup.idempotencyKey}-${i}`, graphMessageId: `${dup.graphMessageId}-${i}` })));
      eq(new Set(same.map((s) => s.reqCode)).size, 1, 'one Requirement ID for concurrent duplicates');
      eq(await live(), before + 1, 'record count');
    });
    await check(13, 'API retries (same idempotency key) do not create duplicates', async () => {
      const p = req({ receivedDateTime: '2030-01-22T05:00:00Z' });
      const before = await live();
      const rs = await Promise.all([ingest(p), ingest(p), ingest(p)]);
      eq(new Set(rs.map((r) => r.reqCode)).size, 1, 'same record');
      eq(await live(), before + 1, 'record count');
    });

    // ---- Synthetic / unverified ------------------------------------------------------
    await check(14, 'Synthetic, test and title-less data is not inserted', async () => {
      const before = await live();
      assert((await ingest(req({ is_test: true }))).ignored, 'is_test');
      assert((await ingest(req({ subject: '[TEST] demo requirement' }))).ignored, '[TEST] subject');
      assert((await ingest(req({ job_title: null }))).ignored, 'missing title is not replaced by subject');
      eq(await live(), before, 'record count');
    });
    await check(15, 'A new requirement in an email with existing ones is not missed', async () => {
      const existing = await reqs.findOne({ reqCode: '2030-01-14-002' });
      const before = await live();
      const msg = { graphMessageId: 'mixed-email-1', receivedDateTime: '2030-01-23T05:00:00Z', subject: 'Re: demands' };
      const r1 = await ingest(req({ ...msg, client_jd_id: existing.sourceClientJdId, job_title: existing.title }));
      const r2 = await ingest(req({ ...msg, client_jd_id: '770001-1', job_title: 'Brand New Role' }));
      eq(r1.reqCode, existing.reqCode, 'existing matched');
      eq(r2.reqCode, '2030-01-23-001', 'new one created');
      eq(await live(), before + 1, 'record count');
    });
    await check(16, 'Missing optional fields do not erase stored values', async () => {
      const doc = await reqs.findOne({ reqCode: '2030-01-15-001' });
      await ingest({ job_title: doc.title, requirement_from: 'Accenture', client_jd_id: doc.sourceClientJdId, source_sender_email: 'demands@iexcel.co.in', receivedDateTime: '2030-02-03T05:00:00Z', graphMessageId: 'sparse-1' });
      const after = await reqs.findOne({ _id: doc._id });
      eq(after.location, doc.location, 'location kept');
      eq(after.budgetText, doc.budgetText, 'budget kept');
      eq(after.experienceRange, doc.experienceRange, 'experience kept');
      eq(after.mandatorySkills, doc.mandatorySkills, 'skills kept');
    });

    // ---- Consistency across layers ---------------------------------------------------
    await check(17, 'DB query, API, workspace endpoint and frontend comparator agree on descending order', async () => {
      const dbOrder = (await reqs.find({ deletedAt: null }).sort({ firstDetectedAt: -1, _id: -1 }).toArray()).map((r) => r.reqCode);
      const apiOrder = (await api('/requirements')).map((r) => r.reqCode);
      eq(apiOrder, dbOrder, 'API vs DB');
      const ws = await api('/workspace');
      const wsOrder = (ws.requirements || []).map((r) => r.reqCode || r.id);
      eq(wsOrder, dbOrder, 'workspace vs DB');
      require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', jsx: 'react-jsx', esModuleInterop: true } });
      const fe = require(path.resolve(backendDir, '..', 'frontend', 'src', 'components', 'pages', 'requirements', 'useRequirementsPageHandlers3.ts'));
      const feOrder = [...(ws.requirements || [])].reverse().sort(fe.compareRequirementsDescending).map((r) => r.reqCode || r.id);
      eq(feOrder, dbOrder, 'frontend comparator vs DB');
      for (let i = 1; i < dbOrder.length; i++) {
        const prev = await reqs.findOne({ reqCode: dbOrder[i - 1] });
        const cur = await reqs.findOne({ reqCode: dbOrder[i] });
        assert(new Date(prev.firstDetectedAt) >= new Date(cur.firstDetectedAt), `older ${dbOrder[i]} placed above newer ${dbOrder[i - 1]}`);
      }
      const pageSize = 5;
      const pages = [];
      for (let p = 0; p * pageSize < feOrder.length; p++) pages.push(...feOrder.slice(p * pageSize, (p + 1) * pageSize));
      eq(pages, feOrder, 'paginated concatenation equals full order');
      eq(new Set(pages).size, pages.length, 'no duplicates across pages');
    });
    await check(19, 'Persisted DB values match API values', async () => {
      const doc = await reqs.findOne({ reqCode: '2030-01-14-001' });
      const fromApi = await api(`/requirements/${doc._id}`);
      eq(fromApi.reqCode, doc.reqCode, 'reqCode');
      eq(fromApi.title, doc.title, 'title');
      eq(fromApi.status, doc.status, 'status');
      eq(fromApi.location, doc.location, 'location');
      eq(new Date(fromApi.firstDetectedAt).toISOString(), new Date(doc.firstDetectedAt).toISOString(), 'firstDetectedAt');
    });
    await check(21, 'An older email replayed later cannot override a newer cancellation', async () => {
      const p = req({ receivedDateTime: '2030-03-01T05:00:00Z' });
      const created = await ingest(p);
      await ingest({ status_update_only: true, requirement_from: 'Accenture', client_jd_id: p.client_jd_id, job_status: 'closed', status_reason: 'cancelled', source_sender_email: 'demands@iexcel.co.in', receivedDateTime: '2030-03-01T10:00:00Z' });
      const replay = await ingest({ ...p, job_status: 'open', monthly_budget: '9.99 Lakhs', idempotencyKey: `${p.idempotencyKey}-replay` });
      const doc = await reqs.findOne({ reqCode: created.reqCode });
      eq(doc.status, 'Closed', 'status stays Closed');
      assert(!/9\.99/.test(doc.budgetText || ''), 'older email does not change fields');
      assert(replay.stale === true, 'replay reported as stale');
    });
    await check(22, 'Presence endpoint reports live, deliberately deleted and missing client IDs', async () => {
      const live = await reqs.findOne({ reqCode: '2030-01-14-002' });
      const gone = await ingest(req({ receivedDateTime: '2030-04-01T05:00:00Z' }));
      const goneDoc = await reqs.findOne({ reqCode: gone.reqCode });
      await reqs.updateOne({ _id: goneDoc._id }, { $set: { deletedAt: new Date() } });
      const r = await fetch(`${BASE}/requirements/presence`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-internal-api-key': KEY },
        body: JSON.stringify({ clientJdIds: [live.sourceClientJdId, goneDoc.sourceClientJdId, '999999-1'] }),
      });
      const d = (await r.json()).data;
      eq(d.live, [live.sourceClientJdId], 'live');
      eq(d.deleted, [goneDoc.sourceClientJdId], 'deleted');
      eq(d.missing, ['999999-1'], 'missing');
      const unauth = await fetch(`${BASE}/requirements/presence`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      eq(unauth.status, 401, 'requires the internal key');
    });
    await check(20, 'Display ID is "YYYY-MM-DD-NNN (client ID)"; stored ID stays clean; both forms resolve', async () => {
      const doc = await reqs.findOne({ reqCode: '2030-01-14-001' });
      const display = `${doc.reqCode} (${doc.sourceClientJdId})`;
      const list = await api('/requirements');
      const row = list.find((r) => r.reqCode === doc.reqCode);
      eq(row.id, display, 'API id shows client ID in brackets');
      eq(row.reqCode, '2030-01-14-001', 'stored reqCode unchanged');
      const ws = await api('/workspace');
      eq((ws.requirements || []).find((r) => r.reqCode === doc.reqCode).id, display, 'workspace id');
      eq((await api(`/requirements/${encodeURIComponent(display)}`))._id, String(doc._id), 'lookup by display ID');
      eq((await api(`/requirements/${encodeURIComponent(doc.reqCode)}`))._id, String(doc._id), 'lookup by stored ID');
      const noRef = (await api('/requirements')).find((r) => !r.sourceClientJdId && /^\d{4}-\d{2}-\d{2}-\d{3}$/.test(r.reqCode));
      if (noRef) eq(noRef.id, noRef.reqCode, 'no brackets when the client gave no ID');
    });

    await check(23, '"5+ years" is stored as a minimum with no maximum and shown as "5+ yrs"', async () => {
      const res = await ingest({
        job_title: 'Senior Embedded Validation Engineer', requirement_from: 'LTTS', client_jd_id: 'EXP-PLUS-1',
        overall_experience: '5 + Years', location: 'Pune', mandatory_skills: ['Python', 'HIL/SIL'],
        source_sender_email: 'demands@ltts.com', receivedDateTime: '2030-03-01T05:00:00Z', graphMessageId: 'exp-plus-1',
      });
      const doc = await reqs.findOne({ sourceClientJdId: 'EXP-PLUS-1', deletedAt: null });
      assert(doc, `requirement created (${JSON.stringify(res).slice(0, 120)})`);
      eq(doc.experienceRange, { min: 5, max: null }, 'open maximum');
      const ws = await api('/workspace');
      eq((ws.requirements || []).find((r) => r.reqCode === doc.reqCode).experience, '5+ yrs', 'workspace label');
    });
  } catch (e) {
    console.log('SUITE ERROR', e.message, '\n--- backend log tail ---\n', backendLog.slice(-3000));
    results.push({ id: 0, name: 'suite', ok: false, err: e.message });
  } finally {
    stop();
    await mongoose.disconnect();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  console.log(`RESULT_JSON:${JSON.stringify(results)}`);
  process.exit(failed.length ? 1 : 0);
})();
