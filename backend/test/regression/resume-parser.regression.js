/*
 * Resume parser integration tests (single + bulk) against an isolated backend instance.
 * Database: <MONGODB_DB_NAME>_test (dropped and re-seeded); backend on TEST_PORT (default 3102).
 * Real resumes found in backend/uploads are parsed too; only field presence is printed, never values.
 *
 * Usage (from backend/): node test/regression/resume-parser.regression.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const TEST_DB = process.env.TEST_DB_NAME || `${process.env.MONGODB_DB_NAME}_test`;
const PORT = Number(process.env.TEST_PORT || 3102);
const BASE = `http://127.0.0.1:${PORT}/api/v1`;
if (!TEST_DB.endsWith('_test')) throw new Error(`Refusing to run against non-test database "${TEST_DB}"`);

const results = [];
async function check(id, name, fn) {
  try {
    await fn();
    results.push({ id, ok: true });
    console.log(`PASS ${id}. ${name}`);
  } catch (e) {
    results.push({ id, ok: false });
    console.log(`FAIL ${id}. ${name}\n      ${e.message}`);
  }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

let token = '';
async function upload(pathname, field, files) {
  const form = new FormData();
  for (const f of files) form.append(field, new Blob([f.buffer]), f.name);
  const r = await fetch(`${BASE}${pathname}`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

const SAMPLE = `Ananya Sharma
Full Stack Developer
Email: ananya.sharma@example.com | Phone: +91 98765 43210
Location: Bangalore, Karnataka
linkedin.com/in/ananyasharma

PROFESSIONAL SUMMARY
Full Stack Developer with 4 years of experience building web applications.

TECHNICAL SKILLS
TypeScript, React, Node.js, PostgreSQL, Docker

EXPERIENCE
Full Stack Developer, Acme Software Pvt Ltd (2022 - Present)

EDUCATION
B.Tech in Computer Science, 2020
`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: TEST_DB });
  await mongoose.connection.db.dropDatabase();
  const db = mongoose.connection.db;
  const backendDir = path.resolve(__dirname, '..', '..');
  const proc = spawn(process.execPath, [require.resolve('ts-node/dist/bin.js', { paths: [backendDir] }), '--transpile-only', 'src/main.ts'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), MONGODB_DB_NAME: TEST_DB, MAIL_EXTRACTION_SCHEDULE_ENABLED: 'false', SEED_ON_START: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  proc.stdout.on('data', (c) => (log = (log + c).slice(-20000)));
  proc.stderr.on('data', (c) => (log = (log + c).slice(-20000)));
  try {
    for (let i = 0; i < 120; i++) {
      try { if ((await fetch(`${BASE}/requirements`)).status === 401) break; } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    const admin = await db.collection('users').findOne({ orgId: { $ne: null }, deletedAt: null, role: { $in: ['superadmin', 'admin'] } });
    token = jwt.sign({ sub: String(admin._id), userId: String(admin.userId || admin._id), email: admin.email, role: admin.role, orgId: String(admin.orgId) },
      process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set'); })(), { expiresIn: '1h' });

    await check(1, 'Endpoints require login', async () => {
      const r = await fetch(`${BASE}/resume-parser/health`);
      assert(r.status === 401, `expected 401, got ${r.status}`);
    });
    await check(2, 'Health reports the parser loaded', async () => {
      const r = await fetch(`${BASE}/resume-parser/health`, { headers: { authorization: `Bearer ${token}` } });
      const b = await r.json();
      assert(b.status === 'ok', `status ${JSON.stringify(b)}`);
      console.log(`      mode: ${b.mode}${b.aiSuspendedNotice ? ` (${b.aiSuspendedNotice})` : ''}`);
    });
    await check(3, 'Single text resume parses into the form fields', async () => {
      const { status, body } = await upload('/resume-parser/parse', 'resume', [{ name: 'ananya.txt', buffer: Buffer.from(SAMPLE) }]);
      assert(status === 200 && body.success, `HTTP ${status} ${JSON.stringify(body).slice(0, 200)}`);
      const d = body.data;
      assert(d.candidateName === 'Ananya Sharma', `name ${d.candidateName}`);
      assert(d.email === 'ananya.sharma@example.com', `email ${d.email}`);
      assert(d.contactNumber === '+919876543210', `phone normalized: ${d.contactNumber}`);
      assert(/TypeScript/.test(d.skills || '') && /Docker/.test(d.skills || ''), `skills ${d.skills}`);
      assert(/Full Stack Developer/i.test(d.technologies || ''), `role ${d.technologies}`);
      assert(/4\s*years/i.test(d.totalExperience || ''), `experience ${d.totalExperience}`);
      assert(/Bangalore/.test(d.currentLocation || ''), `location ${d.currentLocation}`);
      console.log(`      parser: ${d.parser}`);
    });
    await check(4, 'Unsupported file type is rejected with a clear message', async () => {
      const { status, body } = await upload('/resume-parser/parse', 'resume', [{ name: 'virus.exe', buffer: Buffer.from('MZ') }]);
      assert(status === 400 && /unsupported/i.test(body.message || ''), `HTTP ${status} ${JSON.stringify(body)}`);
    });
    const realFiles = fs.readdirSync(path.join(backendDir, 'uploads')).filter((f) => /\.(pdf|docx)$/i.test(f)).slice(0, 4)
      .map((f) => ({ name: f, buffer: fs.readFileSync(path.join(backendDir, 'uploads', f)) }));
    await check(5, `Single real resumes (${realFiles.map((f) => path.extname(f.name)).join(', ')}) extract text and fields`, async () => {
      for (const f of realFiles) {
        const { status, body } = await upload('/resume-parser/parse', 'resume', [f]);
        assert(status === 200 && body.success, `${f.name}: HTTP ${status} ${body.message || ''}`);
        const filled = Object.entries(body.data).filter(([k, v]) => v && !['sourceFile', 'parser'].includes(k)).map(([k]) => k);
        console.log(`      ${f.name}: ${filled.length} fields (${filled.join(', ')}) via ${body.data.parser}`);
        assert(body.data.candidateName || body.data.email, `${f.name}: neither name nor email extracted`);
      }
    });
    await check(6, 'Bulk parse returns one result per file; a corrupt file fails alone', async () => {
      const files = [{ name: 'ananya.txt', buffer: Buffer.from(SAMPLE) }, ...realFiles.slice(0, 2), { name: 'broken.pdf', buffer: Buffer.from('not a pdf') }];
      const { status, body } = await upload('/resume-parser/parse/bulk', 'resumes', files);
      assert(status === 200 && body.success, `HTTP ${status} ${JSON.stringify(body).slice(0, 200)}`);
      assert(body.results.length === files.length, `results ${body.results.length}`);
      files.forEach((f, i) => assert(body.results[i].sourceFile === f.name, `order: ${body.results[i].sourceFile} != ${f.name}`));
      assert(body.results[0].status === 'done' && body.results[0].data.candidateName === 'Ananya Sharma', 'text resume parsed in bulk');
      const broken = body.results[files.length - 1];
      console.log(`      parsed ${body.parsed}, failed ${body.failed}; broken.pdf -> ${broken.status}${broken.error ? ` (${broken.error})` : ''}`);
    });
    await check(7, 'Bulk accepts at most 5 files per request', async () => {
      const six = Array.from({ length: 6 }, (_, i) => ({ name: `r${i}.txt`, buffer: Buffer.from(SAMPLE) }));
      const { status } = await upload('/resume-parser/parse/bulk', 'resumes', six);
      assert(status === 400 || status === 413, `expected rejection, got ${status}`);
    });
  } catch (e) {
    console.log('SUITE ERROR', e.message, '\n', log.slice(-2000));
    results.push({ id: 0, ok: false });
  } finally {
    proc.kill();
    await mongoose.disconnect();
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
