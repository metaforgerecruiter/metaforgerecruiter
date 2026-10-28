import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  assertCanAccessCandidate,
  assertCanAccessClient,
  assertCanAccessRequirement,
  assertCanAccessSubmission,
  assertCanAccessUser,
  orgScope,
  requireOrgId,
} from './resource-access.util';

const orgA = new Types.ObjectId();
const orgB = new Types.ObjectId();
const userA = new Types.ObjectId();
const userB = new Types.ObjectId();
const clientA = new Types.ObjectId();

function caller(overrides: any = {}) {
  return {
    id: userA.toString(),
    orgId: orgA.toString(),
    role: 'recruiter',
    ...overrides,
  };
}

describe('resource-access.util', () => {
  it('requireOrgId fails closed without org', () => {
    expect(() => requireOrgId({})).toThrow(ForbiddenException);
  });

  it('orgScope includes orgId and deletedAt null', () => {
    expect(orgScope(caller())).toEqual({ orgId: orgA, deletedAt: null });
  });

  it('blocks cross-org requirement access', () => {
    expect(() =>
      assertCanAccessRequirement({ orgId: orgB, clientId: clientA }, caller()),
    ).toThrow(NotFoundException);
  });

  it('allows recruiter same-org requirement access', () => {
    expect(() =>
      assertCanAccessRequirement({ orgId: orgA, assignedRecruiterIds: [userB] }, caller()),
    ).not.toThrow();
  });

  it('limits client to their clientId on requirements', () => {
    expect(() =>
      assertCanAccessRequirement(
        { orgId: orgA, clientId: clientA },
        caller({ role: 'client', clientId: clientA.toString() }),
      ),
    ).not.toThrow();
    expect(() =>
      assertCanAccessRequirement(
        { orgId: orgA, clientId: new Types.ObjectId() },
        caller({ role: 'client', clientId: clientA.toString() }),
      ),
    ).toThrow(NotFoundException);
  });

  it('blocks recruiter from another recruiter submission', () => {
    expect(() =>
      assertCanAccessSubmission(
        { orgId: orgA, recruiterId: userB },
        caller({ role: 'recruiter' }),
      ),
    ).toThrow(NotFoundException);
  });

  it('allows recruiter own submission', () => {
    expect(() =>
      assertCanAccessSubmission(
        { orgId: orgA, recruiterId: userA },
        caller({ role: 'recruiter' }),
      ),
    ).not.toThrow();
  });

  it('blocks client from candidate repository by id', () => {
    expect(() =>
      assertCanAccessCandidate({ orgId: orgA }, caller({ role: 'client', clientId: clientA.toString() })),
    ).toThrow(NotFoundException);
  });

  it('limits client record to own client id', () => {
    expect(() =>
      assertCanAccessClient(
        { _id: clientA, orgId: orgA },
        caller({ role: 'client', clientId: clientA.toString() }),
      ),
    ).not.toThrow();
    expect(() =>
      assertCanAccessClient(
        { _id: new Types.ObjectId(), orgId: orgA },
        caller({ role: 'client', clientId: clientA.toString() }),
      ),
    ).toThrow(NotFoundException);
  });

  it('allows self user access; blocks peer non-admin', () => {
    expect(() =>
      assertCanAccessUser({ _id: userA, orgId: orgA }, caller({ role: 'recruiter' })),
    ).not.toThrow();
    expect(() =>
      assertCanAccessUser({ _id: userB, orgId: orgA }, caller({ role: 'recruiter' })),
    ).toThrow(NotFoundException);
    expect(() =>
      assertCanAccessUser({ _id: userB, orgId: orgA }, caller({ role: 'admin' })),
    ).not.toThrow();
  });
});
