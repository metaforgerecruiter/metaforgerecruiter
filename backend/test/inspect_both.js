const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/metaforge_recruiter_v2');
  const reqs = await mongoose.connection.db.collection('requirements').find({
    reqCode: { $in: ['2026/10/14-001', '2026/10/14-003'] }
  }).toArray();

  for (const r of reqs) {
    console.log('----------------------------------------------------');
    console.log('ReqCode:', r.reqCode);
    console.log('_id:', r._id);
    console.log('clientName:', r.clientName);
    console.log('clientId:', r.clientId);
    console.log('title:', r.title);
    console.log('sourceClientJdId:', r.sourceClientJdId);
    console.log('sourceMessageId:', r.sourceMessageId);
    console.log('conversationId:', r.conversationId);
    console.log('inReplyTo:', r.inReplyTo);
    console.log('sourceSubject:', r.sourceSubject);
    console.log('clientEmail:', r.clientEmail);
    console.log('skillsRequired:', r.skillsRequired);
    console.log('mandatorySkills:', r.mandatorySkills);
    console.log('createdAt:', r.createdAt);
    console.log('emailArrivedTime:', r.emailArrivedTime);
    console.log('description:', r.description ? r.description.substring(0, 100) : 'none');
  }

  // Also check clients collection
  const clients = await mongoose.connection.db.collection('clients').find({
    clientName: /ITC Infotech/i
  }).toArray();
  console.log('\nClients found for ITC Infotech:');
  for (const c of clients) {
    console.log('Client _id:', c._id, 'clientName:', c.clientName, 'clientId:', c.clientId);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
