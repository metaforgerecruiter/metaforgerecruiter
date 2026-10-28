const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const titles = [
    'SAP IBP+OBP Consultant',
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
    if (doc) {
      console.log('----------------------------------------------------');
      console.log('Title:', doc.title);
      console.log('ReqCode:', doc.reqCode);
      console.log('Client:', doc.clientName);
      console.log('ClientEmail:', doc.clientEmail);
      console.log('SourceSubject:', doc.sourceSubject);
      console.log('SourceMessageId:', doc.sourceMessageId);
      console.log('Arrived:', doc.emailArrivedTime);
      console.log('CreatedAt:', doc.createdAt);
      console.log('Skills:', doc.skillsRequired);
    } else {
      console.log(`Title NOT found: ${t}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
