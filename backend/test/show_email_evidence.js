const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');

  const titles = [
    'Mould Design & Engg Composite Material',
    'Tool & Equipment Maintenance',
    'Power System Engineer',
    'Manual Test Engineer',
    'Pipe Stress Analyst',
  ];

  for (const t of titles) {
    const doc = await mongoose.connection.db.collection('requirements').findOne({
      title: { $regex: new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });

    console.log('================================================================');
    console.log('Job Title:', doc?.title);
    console.log('Client Name:', doc?.clientName);
    console.log('From Email:', doc?.clientEmail);
    console.log('Subject:', doc?.sourceSubject);
    console.log('Outlook Msg ID:', doc?.sourceMessageId);
    console.log('Email Arrived Date/Time:', doc?.emailArrivedTime);
    console.log('Skills:', (doc?.skillsRequired || []).slice(0, 5).join(', '));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
