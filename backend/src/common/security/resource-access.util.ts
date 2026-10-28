import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Resolve caller org — fail closed (no hardcoded org fallback).
 */
export function requireOrgId(currentUser: any): Types.ObjectId {
  if (!currentUser?.orgId) {
    throw new ForbiddenException('Organization context is required');
  }
  return new Types.ObjectId(currentUser.orgId.toString());
}

export function orgScope(currentUser: any): { orgId: Types.ObjectId; deletedAt: null } {
  return { orgId: requireOrgId(currentUser), deletedAt: null };
}

export function idsEqual(a: any, b: any): boolean {
  if (a == null || b == null) return false;
  return String(a.toString()) === String(b.toString());
}

/**
 * Cross-tenant guard. Use NotFound (not Forbidden) to avoid confirming foreign IDs.
 */
export function assertSameOrg(doc: { orgId?: any } | null | undefined, currentUser: any, label = 'Resource'): void {
  if (!doc) {
    throw new NotFoundException(`${label} not found`);
  }
  const userOrg = requireOrgId(currentUser).toString();
  const docOrg = doc.orgId != null ? String(doc.orgId.toString()) : '';
  if (!docOrg || docOrg !== userOrg) {
    throw new NotFoundException(`${label} not found`);
  }
}

export function roleOf(currentUser: any): string {
  return String(currentUser?.role || '').toLowerCase();
}

export function isOrgAdminRole(role: string): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'devteam';
}

export function callerUserObjectId(currentUser: any): Types.ObjectId | null {
  const raw = currentUser?.id || currentUser?._id || currentUser?.userId;
  if (!raw || !Types.ObjectId.isValid(String(raw))) return null;
  return new Types.ObjectId(String(raw));
}

/**
 * Requirement visibility within an org (after assertSameOrg).
 * Recruiters/leads share the org requirement pool (list + detail); clients only their account.
 */
export function assertCanAccessRequirement(doc: any, currentUser: any): void {
  assertSameOrg(doc, currentUser, 'Requirement');
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role) || role === 'lead' || role === 'recruiter') return;

  if (role === 'client') {
    const clientId = currentUser.clientId;
    if (!clientId || !idsEqual(doc.clientId, clientId)) {
      throw new NotFoundException('Requirement not found');
    }
  }
}

/**
 * Submission visibility within an org.
 */
export function assertCanAccessSubmission(doc: any, currentUser: any): void {
  assertSameOrg(doc, currentUser, 'Submission');
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role) || role === 'lead') return;

  if (role === 'recruiter') {
    const uid = callerUserObjectId(currentUser);
    if (uid && idsEqual(doc.recruiterId, uid)) return;
    throw new NotFoundException('Submission not found');
  }

  if (role === 'client') {
    if (currentUser.clientId && idsEqual(doc.clientId, currentUser.clientId)) return;
    throw new NotFoundException('Submission not found');
  }
}

/**
 * Candidate visibility within an org.
 */
export function assertCanAccessCandidate(doc: any, currentUser: any): void {
  assertSameOrg(doc, currentUser, 'Candidate');
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role) || role === 'lead' || role === 'recruiter') return;

  if (role === 'client') {
    // Clients should not browse the candidate repository by ID.
    throw new NotFoundException('Candidate not found');
  }
}

/**
 * Client record visibility within an org.
 */
export function assertCanAccessClient(doc: any, currentUser: any): void {
  assertSameOrg(doc, currentUser, 'Client');
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role) || role === 'lead' || role === 'recruiter') return;

  if (role === 'client') {
    if (currentUser.clientId && idsEqual(doc._id, currentUser.clientId)) return;
    throw new NotFoundException('Client not found');
  }
}

/**
 * Interview visibility — prefers linked submission ownership when present.
 */
export function assertCanAccessInterview(doc: any, currentUser: any, linkedSubmission?: any): void {
  assertSameOrg(doc, currentUser, 'Interview');
  if (linkedSubmission) {
    assertCanAccessSubmission(linkedSubmission, currentUser);
    return;
  }
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role) || role === 'lead') return;
  if (role === 'recruiter') {
    const uid = callerUserObjectId(currentUser);
    if (uid && (idsEqual(doc.recruiterId, uid) || idsEqual(doc.createdBy, uid))) return;
    throw new NotFoundException('Interview not found');
  }
  if (role === 'client') {
    if (currentUser.clientId && idsEqual(doc.clientId, currentUser.clientId)) return;
    throw new NotFoundException('Interview not found');
  }
}

/**
 * User profile access: self or org admin.
 */
export function assertCanAccessUser(doc: any, currentUser: any): void {
  assertSameOrg(doc, currentUser, 'User');
  const role = roleOf(currentUser);
  if (isOrgAdminRole(role)) return;
  const uid = callerUserObjectId(currentUser);
  if (uid && (idsEqual(doc._id, uid) || idsEqual(doc.userId, currentUser.userId))) return;
  throw new NotFoundException('User not found');
}
