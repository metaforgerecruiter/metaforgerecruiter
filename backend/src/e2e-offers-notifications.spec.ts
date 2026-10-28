import * as mongooseLib from 'mongoose';
import { Types } from 'mongoose';
import { OffersService } from './modules/offers/offers.service';
import { OffersController } from './modules/offers/offers.controller';
import { OfferRepository } from './modules/offers/repositories/offer.repository';
import { Offer, OfferSchema } from './modules/offers/schemas/offer.schema';
import { NotificationsService } from './modules/notifications/notifications.service';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { Notification, NotificationSchema } from './modules/notifications/schemas/notification.schema';
import { Submission, SubmissionSchema } from './modules/submissions/schemas/submission.schema';
import { Candidate, CandidateSchema } from './modules/candidates/schemas/candidate.schema';
import { Requirement, RequirementSchema } from './modules/requirements/schemas/requirement.schema';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { GUARDS_METADATA } from '@nestjs/common/constants';

async function runE2ETests() {
  console.log('=== STARTING OFFERS & NOTIFICATIONS E2E TEST SUITE ===\n');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'metaforge_recruiter_v2';

  console.log(`[E2E] Connecting to MongoDB: ${uri}/${dbName}`);
  await mongooseLib.connect(`${uri}/${dbName}`);

  const offerModel = mongooseLib.model(Offer.name, OfferSchema);
  const notificationModel = mongooseLib.model(Notification.name, NotificationSchema);
  const submissionModel = mongooseLib.model(Submission.name, SubmissionSchema);
  const candidateModel = mongooseLib.model(Candidate.name, CandidateSchema);
  const requirementModel = mongooseLib.model(Requirement.name, RequirementSchema);

  const offerRepository = new OfferRepository(offerModel as any);
  const notificationsService = new NotificationsService(notificationModel as any);
  const offersService = new OffersService(
    offerModel as any,
    submissionModel as any,
    candidateModel as any,
    requirementModel as any,
    offerRepository,
    notificationsService,
  );

  const offersController = new OffersController(offersService);
  const notificationsController = new NotificationsController(notificationsService);

  const orgId1 = new Types.ObjectId('6ab4f38ff2e0e1823c038948');
  const orgId2 = new Types.ObjectId('7ab4f38ff2e0e1823c038999');
  const userId1 = new Types.ObjectId('6ab6245b10fcb90ec8ecbf04');
  const userId2 = new Types.ObjectId('7ab6245b10fcb90ec8ecbf99');

  const currentUserOrg1 = { orgId: orgId1, id: userId1, role: 'admin' };
  const currentUserOrg2 = { orgId: orgId2, id: userId2, role: 'admin' };

  let testPassedCount = 0;
  let testFailedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      testPassedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      testFailedCount++;
    }
  }

  // --- 1. VERIFY JWT GUARDS ---
  console.log('\n--- 1. JWT Authentication Guard Verification ---');
  const offersGuards = Reflect.getMetadata(GUARDS_METADATA, OffersController);
  assert(offersGuards && offersGuards.includes(JwtAuthGuard), 'OffersController registered with JwtAuthGuard');

  const notificationsGuards = Reflect.getMetadata(GUARDS_METADATA, NotificationsController);
  assert(notificationsGuards && notificationsGuards.includes(JwtAuthGuard), 'NotificationsController registered with JwtAuthGuard');

  // --- 2. OFFERS MODULE TESTS ---
  console.log('\n--- 2. Offers Module E2E Integration ---');

  // Find or create test candidate, requirement, and submission
  let subDoc = await submissionModel.findOne({ orgId: orgId1, deletedAt: null }).exec();
  if (!subDoc) {
    const cand = await candidateModel.create({
      orgId: orgId1,
      candidateId: 'CAND-TEST-01',
      name: 'E2E Test Candidate',
      sourcedByRecruiterId: userId1,
      email: 'e2e.candidate@example.com',
      phone: '+1234567890',
      skills: ['TypeScript', 'NestJS'],
    } as any);
    const req = await requirementModel.create({
      orgId: orgId1,
      reqCode: 'REQ-TEST-01',
      title: 'E2E Software Engineer',
      clientName: 'Test Client Ltd',
      status: 'Open',
    } as any);
    subDoc = await submissionModel.create({
      orgId: orgId1,
      submissionId: 'SUB-TEST-01',
      candidateId: cand?._id,
      requirementId: req?._id,
      recruiterId: userId1,
      stage: 'Interview In Progress',
    } as any);
  }

  // Test Offer Creation
  const createDto = {
    submissionId: subDoc._id.toString(),
    offeredCtc: 1800000,
    joiningDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'Offer Released',
  };

  let createdOffer: any = null;
  try {
    createdOffer = await offersService.create(createDto, currentUserOrg1);
    assert(createdOffer && createdOffer.id && createdOffer.offerId.startsWith('OFR-'), 'Create Offer generates valid ID and sequence code');
    assert(createdOffer.offeredCtc === 1800000, 'Created Offer has correct offeredCtc');
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      // If active offer already exists for this submission, fetch it
      const existingOffers = await offersService.findAll(currentUserOrg1, { submissionId: subDoc._id.toString() });
      createdOffer = existingOffers[0];
      assert(createdOffer && createdOffer.id, 'Retrieved pre-existing Offer for submission');
    } else {
      assert(false, `Create Offer thrown error: ${err.message}`);
    }
  }

  // Verify Submission stage updated to 'Offered'
  const updatedSubAfterOffer = await submissionModel.findById(subDoc._id).exec();
  assert(updatedSubAfterOffer?.stage === 'Offered' || updatedSubAfterOffer?.stage === 'Placed', 'Submission stage updated to Offered/Placed');

  // Test Find All Offers
  const allOffersOrg1 = await offersService.findAll(currentUserOrg1, { search: createdOffer.offerId });
  assert(allOffersOrg1.length > 0 && allOffersOrg1[0].offerId === createdOffer.offerId, 'Find All Offers returns matching record');

  // Test Find By ID (both ObjectId and offerId sequence)
  const offerById = await offersService.findById(createdOffer.id, currentUserOrg1);
  assert(offerById.id === createdOffer.id, 'Find Offer by Mongo _id');

  const offerBySeqId = await offersService.findById(createdOffer.offerId, currentUserOrg1);
  assert(offerBySeqId.id === createdOffer.id, 'Find Offer by offerId sequence (OFR-XXX)');

  // Test Update Offer
  const updatedOffer = await offersService.update(createdOffer.id, { offeredCtc: 2000000 }, currentUserOrg1);
  assert(updatedOffer.offeredCtc === 2000000, 'Update Offer CTC successfully');

  // Test Update Offer Status to Joined
  const statusUpdatedOffer = await offersService.updateStatus(createdOffer.id, { status: 'Joined', notes: 'Candidate joined' }, currentUserOrg1);
  assert(statusUpdatedOffer.status === 'Joined', 'Update Offer status to Joined');

  const updatedSubAfterJoined = await submissionModel.findById(subDoc._id).exec();
  assert(updatedSubAfterJoined?.stage === 'Placed', 'Submission stage updated to Placed when offer status is Joined');

  // Test Tenant Isolation for Offers
  try {
    await offersService.findById(createdOffer.id, currentUserOrg2);
    assert(false, 'Org2 should NOT be able to access Org1 Offer');
  } catch (err: any) {
    assert(err.status === 404 || err.message.includes('not found'), 'Tenant Isolation: Org2 accessing Org1 Offer returns 404 Not Found');
  }

  const offersOrg2 = await offersService.findAll(currentUserOrg2);
  const foundInOrg2 = offersOrg2.some((o: any) => o.id === createdOffer.id);
  assert(!foundInOrg2, 'Tenant Isolation: Org1 Offer not visible in Org2 list query');

  // Test Soft Delete Offer
  const deleteResult = await offersService.softDelete(createdOffer.id, currentUserOrg1);
  assert(deleteResult.message.includes('soft-deleted'), 'Soft delete Offer executed successfully');

  try {
    await offersService.findById(createdOffer.id, currentUserOrg1);
    assert(false, 'Soft-deleted Offer should not be retrievable');
  } catch (err: any) {
    assert(err.status === 404 || err.message.includes('not found'), 'Soft-deleted Offer query returns 404 Not Found');
  }


  // --- 3. NOTIFICATIONS MODULE TESTS ---
  console.log('\n--- 3. Notifications Module E2E Integration ---');

  // Test Create Notification
  const createdNotification = await notificationsService.createNotification({
    orgId: orgId1,
    userId: userId1,
    type: 'offer_released',
    title: 'E2E Offer Notification',
    message: 'Offer released for E2E candidate',
    entityId: new Types.ObjectId(),
    entityType: 'offer',
  });
  assert(createdNotification && createdNotification._id !== undefined, 'Create Notification successfully');

  // Test Find All Notifications
  const notificationsList = await notificationsService.findAll(currentUserOrg1, { unreadOnly: true });
  assert(notificationsList.items.length > 0, 'Find All Notifications returns items');
  assert(notificationsList.unreadCount > 0, 'Unread count reported correctly');

  // Test Find Notification By ID
  const foundNotif = await notificationsService.findById(createdNotification._id.toString(), currentUserOrg1);
  assert(foundNotif.id === createdNotification._id.toString(), 'Find Notification by ID');

  // Test Mark Notification As Read
  const readNotif = await notificationsService.markAsRead(createdNotification._id.toString(), currentUserOrg1);
  assert(readNotif.read === true && readNotif.readAt !== null, 'Mark single notification as read');

  // Test Mark All As Read
  const markAllResult = await notificationsService.markAllAsRead(currentUserOrg1);
  assert(typeof markAllResult.updatedCount === 'number', 'Mark all notifications as read executed');

  // Test Tenant Isolation for Notifications
  try {
    await notificationsService.findById(createdNotification._id.toString(), currentUserOrg2);
    assert(false, 'Org2/User2 should NOT be able to access Org1 Notification');
  } catch (err: any) {
    assert(err.status === 404 || err.message.includes('not found'), 'Tenant Isolation: Org2 accessing Org1 Notification returns 404 Not Found');
  }

  // Test Soft Delete Notification
  const deleteNotifResult = await notificationsService.softDelete(createdNotification._id.toString(), currentUserOrg1);
  assert(deleteNotifResult.message.includes('removed successfully'), 'Delete Notification executed successfully');

  console.log('\n=== E2E TEST SUMMARY ===');
  console.log(`Passed: ${testPassedCount}`);
  console.log(`Failed: ${testFailedCount}`);

  await mongooseLib.disconnect();

  if (testFailedCount > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal E2E test execution error:', err);
  process.exit(1);
});
