import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { hashPasswordArgon2id } from '../../common/security/password.util';
import { allowDemoCredentials, isProductionEnv, resolveDemoPassword } from '../../common/security/secrets.util';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { Requirement, RequirementDocument } from '../requirements/schemas/requirement.schema';
import { RolePermission, RolePermissionDocument } from '../users/schemas/role-permission.schema';
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema';
import { Submission, SubmissionDocument } from '../submissions/schemas/submission.schema';
import { Interview, InterviewDocument } from '../interviews/schemas/interview.schema';
import { ActivityLog, ActivityLogDocument } from '../audit/schemas/activity-log.schema';
import { Team, TeamDocument } from '../teams/schemas/team.schema';

/** Demo user identities only — passwords come from SEED_DEMO_PASSWORD / DEMO_PASSWORD_* env. */
const DEMO_USERS = [
  { email: 'r.haines@talentflow.io', role: 'superadmin', name: 'Robert Haines', userId: 'USR-1001' },
  { email: 'd.park@talentflow.io', role: 'admin', name: 'David Park', userId: 'USR-1002' },
  { email: 'l.ho@talentflow.io', role: 'admin', name: 'Lisa Ho', userId: 'USR-1007' },
  { email: 'harish.g@metaforgeit.com', role: 'lead', name: 'Harish Gadipally', userId: 'USR-1003' },
  { email: 't.walsh@talentflow.io', role: 'lead', name: 'Tom Walsh', userId: 'USR-1008' },
  { email: 'm.chen@talentflow.io', role: 'recruiter', name: 'Marcus Chen', userId: 'USR-1004' },
  { email: 'p.sharma@talentflow.io', role: 'recruiter', name: 'Priya Sharma', userId: 'USR-1009' },
  { email: 'j.obrien@talentflow.io', role: 'recruiter', name: "James O'Brien", userId: 'USR-1010' },
  { email: 'dev.team@talentflow.io', role: 'devteam', name: 'Dev Team Engineer', userId: 'USR-1005' },
  { email: 'client@accenture.com', role: 'client', name: 'Client Account Lead', userId: 'USR-1006' },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Organization.name) private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Requirement.name) private readonly requirementModel: Model<RequirementDocument>,
    @InjectModel(RolePermission.name) private readonly roleModel: Model<RolePermissionDocument>,
    @InjectModel(Candidate.name) private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Interview.name) private readonly interviewModel: Model<InterviewDocument>,
    @InjectModel(ActivityLog.name) private readonly logModel: Model<ActivityLogDocument>,
    @InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>,
  ) {}

  async onModuleInit() {
    if (isProductionEnv()) {
      this.logger.log('SEED_ON_START skipped: demo seeding is forbidden in production');
      return;
    }
    const enabled = String(
      this.config.get('SEED_ON_START') ?? 'false',
    ).toLowerCase() === 'true';
    if (!enabled) return;
    if (!allowDemoCredentials()) {
      this.logger.warn(
        'SEED_ON_START ignored: set ALLOW_DEMO_LOGIN=true and SEED_DEMO_PASSWORD (env/vault) for local demo users',
      );
      return;
    }
    try {
      await this.seed();
    } catch (err) {
      this.logger.error(`Seed failed: ${(err as Error).message}`);
    }
  }

  async seed() {
    let org = await this.orgModel.findOne({ slug: 'metaforge' }).exec();
    if (!org) {
      org = await this.orgModel.create({
        name: 'MetaForge',
        slug: 'metaforge',
        tier: 'Enterprise',
        active: true,
        schemaVersion: 1,
      });
      this.logger.log('Seeded organization MetaForge');
    }
    const orgId = org._id as Types.ObjectId;

    const usersByEmail = new Map<string, UserDocument>();
    for (const demo of DEMO_USERS) {
      const password = resolveDemoPassword(demo.role) || resolveDemoPassword();
      if (!password) {
        this.logger.warn(
          `Skipping demo user ${demo.email}: set SEED_DEMO_PASSWORD or DEMO_PASSWORD_${demo.role.toUpperCase()} in env`,
        );
        continue;
      }
      let user = await this.userModel.findOne({ email: demo.email }).exec();
      if (!user) {
        user = await this.userModel.create({
          orgId,
          userId: demo.userId,
          name: demo.name,
          email: demo.email,
          passwordHash: await hashPasswordArgon2id(password),
          role: demo.role,
          active: true,
          schemaVersion: 1,
        });
      }
      usersByEmail.set(demo.email, user);
    }

    const harper = usersByEmail.get('harish.g@metaforgeit.com');
    const marcus = usersByEmail.get('m.chen@talentflow.io');
    const priya = usersByEmail.get('p.sharma@talentflow.io');
    const james = usersByEmail.get('j.obrien@talentflow.io');
    const tom = usersByEmail.get('t.walsh@talentflow.io');

    if ((await this.teamModel.countDocuments({ orgId }).exec()) === 0 && harper && marcus) {
      await this.teamModel.create({
        orgId,
        teamId: 'TEAM-100',
        teamName: 'Accenture Delivery Pod',
        leadId: harper._id,
        recruiterIds: [marcus._id, priya?._id].filter(Boolean),
        active: true,
        schemaVersion: 1,
      });
      if (tom && james) {
        await this.teamModel.create({
          orgId,
          teamId: 'TEAM-101',
          teamName: 'Capital Markets Pod',
          leadId: tom._id,
          recruiterIds: [james._id],
          active: true,
          schemaVersion: 1,
        });
      }
    }

    const clientSpecs = [
      { clientId: 'CLI-100', clientName: 'Accenture', domain: 'Enterprise Cloud & Tech Services', poc: { name: 'Kallol Chakraborty', email: 'kallol.c@accenture.com', phone: '+91 98765 11223' } },
      { clientId: 'CLI-101', clientName: 'Goldman Sachs', domain: 'Capital Markets Technology', poc: { name: 'Priya Menon', email: 'p.menon@gs.com', phone: '+1 555-0101' } },
      { clientId: 'CLI-102', clientName: 'Tesla', domain: 'Automotive & Energy Software', poc: { name: 'Alex Rivera', email: 'a.rivera@tesla.com', phone: '+1 555-0102' } },
      { clientId: 'CLI-103', clientName: 'Microsoft', domain: 'Cloud Platform Engineering', poc: { name: 'Sara Kim', email: 'sara.kim@microsoft.com', phone: '+1 555-0103' } },
    ];
    const clientsByName = new Map<string, ClientDocument>();
    for (const spec of clientSpecs) {
      let client = await this.clientModel.findOne({ clientName: spec.clientName, orgId }).exec();
      if (!client) {
        client = await this.clientModel.create({
          orgId,
          clientId: spec.clientId,
          clientName: spec.clientName,
          domain: spec.domain,
          tier: 'Enterprise',
          status: 'Active',
          slaDays: 5,
          pocContacts: [spec.poc],
          accountLeadId: harper?._id,
          schemaVersion: 1,
        });
      }
      clientsByName.set(spec.clientName, client);
    }

    const accenture = clientsByName.get('Accenture');
    const gs = clientsByName.get('Goldman Sachs');
    const tesla = clientsByName.get('Tesla');
    const assignedRecruiters = [marcus, priya, james].filter(Boolean).map((u) => u!._id);

    if ((await this.requirementModel.countDocuments({ orgId, deletedAt: null }).exec()) === 0 && accenture) {
      const reqs = [
        { reqCode: 'REQ-2026-06-19-001', title: 'Senior React Developer', client: accenture, priority: 'High', status: 'Assigned', location: 'Hyderabad / Hybrid', skills: ['React', 'TypeScript', 'Next.js'], openings: 2 },
        { reqCode: 'REQ-2026-06-19-002', title: 'Fullstack React Developer', client: accenture, priority: 'Medium', status: 'Open', location: 'Remote', skills: ['React', 'TypeScript', 'Node.js'], openings: 3 },
        { reqCode: 'REQ-2026-06-19-003', title: 'Java Architect', client: gs || accenture, priority: 'High', status: 'Assigned', location: 'Bangalore', skills: ['Java', 'Spring Boot', 'Kafka'], openings: 1 },
        { reqCode: 'REQ-2026-06-19-004', title: 'Python ML Engineer', client: tesla || accenture, priority: 'High', status: 'Open', location: 'Remote', skills: ['Python', 'PyTorch', 'MLOps'], openings: 2 },
        { reqCode: 'REQ-2026-06-19-005', title: 'AI Data Engineer', client: accenture, priority: 'High', status: 'Assigned', location: 'Hyderabad / Hybrid', skills: ['Python', 'Spark', 'Azure Databricks'], openings: 2 },
      ];
      for (const r of reqs) {
        await this.requirementModel.create({
          orgId,
          reqCode: r.reqCode,
          title: r.title,
          clientId: r.client._id,
          clientName: r.client.clientName,
          priority: r.priority,
          status: r.status,
          assignmentStatus: 'Assigned',
          openings: r.openings,
          location: r.location,
          skillsRequired: r.skills,
          assignedLeadId: harper?._id,
          assignedRecruiterIds: assignedRecruiters,
          schemaVersion: 1,
        });
      }
    }

    const req001 = await this.requirementModel.findOne({ orgId, reqCode: 'REQ-2026-06-19-001' }).exec();
    const req003 = await this.requirementModel.findOne({ orgId, reqCode: 'REQ-2026-06-19-003' }).exec();
    const req004 = await this.requirementModel.findOne({ orgId, reqCode: 'REQ-2026-06-19-004' }).exec();

    if ((await this.candidateModel.countDocuments({ orgId, deletedAt: null }).exec()) === 0 && marcus) {
      const candSpecs = [
        { candidateId: 'CAND-2026-08-07-001', name: 'Priya Nair', email: 'priya.nair@contoso.com', phone: '+919876543210', company: 'Contoso', skills: ['React', 'TypeScript'], exp: 4.5, loc: 'Bengaluru', status: 'Parsed' },
        { candidateId: 'CAND-2026-08-07-002', name: 'Alex Turner', email: 'alex.turner@dev.com', phone: '+15550192', company: 'Acme Corp', skills: ['React', 'Next.js'], exp: 8, loc: 'New York', status: 'Submitted' },
        { candidateId: 'CAND-2026-08-07-003', name: 'Rania Khalil', email: 'rkhalil@java.com', phone: '+15550231', company: 'Goldman Sachs', skills: ['Java', 'Spring Boot'], exp: 11, loc: 'Chicago', status: 'Submitted' },
        { candidateId: 'CAND-2026-08-07-004', name: 'Ben Wallace', email: 'ben.w@ai.com', phone: '+15550412', company: 'Tesla', skills: ['Python', 'ML'], exp: 10, loc: 'Austin', status: 'Placed' },
        { candidateId: 'CAND-2026-08-07-005', name: 'Sarah Nguyen', email: 'sarah.n@techmail.io', phone: '+15550184', company: 'Infosys', skills: ['React', 'Node.js'], exp: 6, loc: 'Hyderabad', status: 'New' },
        { candidateId: 'CAND-2026-08-07-006', name: 'Soo-Jin Lee', email: 'soojin.l@tech.kr', phone: '+15550199', company: 'Samsung', skills: ['DevOps', 'K8s'], exp: 7, loc: 'Seoul', status: 'Submitted' },
      ];
      for (const c of candSpecs) {
        await this.candidateModel.create({
          orgId,
          candidateId: c.candidateId,
          name: c.name,
          email: c.email,
          phone: c.phone,
          currentCompany: c.company,
          skills: c.skills,
          totalExperienceYears: c.exp,
          relevantExperienceYears: Math.max(c.exp - 1, 1),
          currentLocation: c.loc,
          preferredLocation: c.loc,
          sourcedByRecruiterId: marcus._id,
          status: c.status,
          schemaVersion: 1,
        });
      }
    }

    if ((await this.submissionModel.countDocuments({ orgId, deletedAt: null }).exec()) === 0 && req001 && marcus && accenture) {
      const alex = await this.candidateModel.findOne({ email: 'alex.turner@dev.com' }).exec();
      const sarah = await this.candidateModel.findOne({ email: 'sarah.n@techmail.io' }).exec();
      const rania = await this.candidateModel.findOne({ email: 'rkhalil@java.com' }).exec();
      const ben = await this.candidateModel.findOne({ email: 'ben.w@ai.com' }).exec();
      const rows = [
        { submissionId: 'SUB-201', cand: alex, req: req001, client: accenture, rec: marcus, stage: 'Interview Scheduled', score: 94 },
        { submissionId: 'SUB-202', cand: sarah, req: req001, client: accenture, rec: marcus, stage: 'Submitted', score: 87 },
        { submissionId: 'SUB-207', cand: rania, req: req003 || req001, client: gs || accenture, rec: james || marcus, stage: 'Interview Scheduled', score: 96 },
        { submissionId: 'SUB-208', cand: ben, req: req004 || req001, client: tesla || accenture, rec: marcus, stage: 'Placed', score: 98 },
      ];
      for (const row of rows) {
        if (!row.cand || !row.req || !row.rec) continue;
        await this.submissionModel.create({
          orgId,
          submissionId: row.submissionId,
          candidateId: row.cand._id,
          requirementId: row.req._id,
          clientId: row.client._id,
          recruiterId: row.rec._id,
          leadId: harper?._id,
          stage: row.stage,
          matchScore: row.score,
          submittedAt: new Date(),
          schemaVersion: 1,
        });
      }
    }

    if ((await this.interviewModel.countDocuments({ orgId, deletedAt: null }).exec()) === 0 && req001) {
      const alex = await this.candidateModel.findOne({ email: 'alex.turner@dev.com' }).exec();
      const rania = await this.candidateModel.findOne({ email: 'rkhalil@java.com' }).exec();
      const sub201 = await this.submissionModel.findOne({ submissionId: 'SUB-201' }).exec();
      const sub207 = await this.submissionModel.findOne({ submissionId: 'SUB-207' }).exec();
      if (alex && sub201) {
        await this.interviewModel.create({
          orgId,
          interviewId: 'INT-101',
          submissionId: sub201._id,
          candidateId: alex._id,
          requirementId: req001._id,
          round: 'L2 Technical',
          dateTime: new Date('2026-08-06T10:00:00Z'),
          interviewerName: 'Hiring Manager',
          interviewerEmail: 'hm@accenture.com',
          status: 'Scheduled',
          schemaVersion: 1,
        });
      }
      if (rania && sub207 && req003) {
        await this.interviewModel.create({
          orgId,
          interviewId: 'INT-102',
          submissionId: sub207._id,
          candidateId: rania._id,
          requirementId: req003._id,
          round: 'HR Round',
          dateTime: new Date('2026-08-06T14:00:00Z'),
          interviewerName: 'HR Partner',
          interviewerEmail: 'hr@gs.com',
          status: 'Passed',
          schemaVersion: 1,
        });
      }
    }

    if ((await this.logModel.countDocuments({ orgId }).exec()) === 0 && marcus) {
      await this.logModel.create({
        orgId,
        userId: marcus._id,
        userName: marcus.name,
        userEmail: marcus.email,
        userRole: 'recruiter',
        action: 'Seeded workspace bootstrap data',
        category: 'System & Access',
        targetEntity: 'Workspace',
        targetId: 'SEED',
        clientName: 'Accenture',
        ipAddress: '127.0.0.1',
        status: 'Success',
        details: { message: 'Initial seed completed' },
        schemaVersion: 1,
      });
    }

    const roleCount = await this.roleModel.countDocuments({ orgId }).exec();
    if (roleCount === 0) {
      await this.roleModel.insertMany([
        { orgId, roleCode: 'superadmin', roleName: 'Super Admin', permissions: ['*'] },
        { orgId, roleCode: 'admin', roleName: 'Admin', permissions: ['req_view_all', 'req_create', 'req_edit', 'req_assign', 'cand_search', 'cand_add', 'sub_create', 'sub_view_all', 'int_schedule', 'int_feedback', 'user_manage'] },
        { orgId, roleCode: 'lead', roleName: 'Team Lead', permissions: ['req_view_all', 'req_assign', 'req_edit', 'cand_search', 'cand_add', 'sub_create', 'sub_view_all', 'sub_move_stage', 'int_schedule', 'int_feedback'] },
        { orgId, roleCode: 'recruiter', roleName: 'Recruiter', permissions: ['req_assign', 'req_edit', 'cand_search', 'cand_add', 'sub_create', 'sub_move_stage', 'int_schedule', 'int_feedback'] },
        { orgId, roleCode: 'devteam', roleName: 'Dev Team', permissions: ['*'] },
        { orgId, roleCode: 'client', roleName: 'Client', permissions: ['req_view_own', 'sub_view_client', 'int_feedback'] },
      ]);
    }

    this.logger.log('SEED_ON_START complete');
  }
}
