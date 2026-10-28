const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = 'f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/data/processed_messages.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening sqlite DB:', err);
    process.exit(1);
  }
});

const titles = [
  'Mould Design & Engg Composite Material',
  'Tool & Equipment Maintenance',
  'Power System Engineer',
  'Manual Test Engineer',
  'Pipe Stress Analyst',
];

db.all("SELECT graph_id, subject, from_addr, received_at FROM seen_messages ORDER BY received_at DESC LIMIT 30", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Seen messages in Outlook extraction store (${rows.length}):\n`);
  for (const r of rows) {
    console.log(`- Time: ${r.received_at} | From: ${r.from_addr} | Subj: ${r.subject}`);
  }
  db.close();
});
