import * as crypto from 'crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { resolveJwtSecret } from './secrets.util';

export interface FileDownloadClaims {
  /** Mongo id or business fileId */
  fid: string;
  /** Organization id */
  oid: string;
  /** Unix epoch seconds expiry */
  exp: number;
  /** Optional uploader / requester user id */
  uid?: string;
}

function signingSecret(): string {
  const dedicated = (process.env.FILE_SIGNING_SECRET || '').trim();
  if (dedicated.length >= 32) return dedicated;
  return resolveJwtSecret(process.env.JWT_SECRET);
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function sign(payloadB64: string): string {
  return b64url(crypto.createHmac('sha256', signingSecret()).update(payloadB64).digest());
}

export function defaultSignedUrlTtlSeconds(): number {
  const n = Number(process.env.FILE_DOWNLOAD_TTL_SECONDS || 300);
  if (!Number.isFinite(n) || n < 30) return 300;
  return Math.min(Math.floor(n), 3600);
}

/** Create a compact signed token for resume download (HMAC, expiring). */
export function createFileDownloadToken(claims: Omit<FileDownloadClaims, 'exp'> & { exp?: number }): string {
  const exp = claims.exp ?? Math.floor(Date.now() / 1000) + defaultSignedUrlTtlSeconds();
  const body: FileDownloadClaims = {
    fid: String(claims.fid),
    oid: String(claims.oid),
    exp,
    ...(claims.uid ? { uid: String(claims.uid) } : {}),
  };
  const payloadB64 = b64url(JSON.stringify(body));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifyFileDownloadToken(token: string): FileDownloadClaims {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new UnauthorizedException('Invalid or missing download token');
  }
  const [payloadB64, sig, ...rest] = token.split('.');
  if (!payloadB64 || !sig || rest.length) {
    throw new UnauthorizedException('Malformed download token');
  }
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new UnauthorizedException('Invalid download token signature');
  }
  let claims: FileDownloadClaims;
  try {
    claims = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch {
    throw new BadRequestException('Corrupt download token payload');
  }
  if (!claims?.fid || !claims?.oid || !claims?.exp) {
    throw new BadRequestException('Incomplete download token');
  }
  if (Number(claims.exp) < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Download link has expired');
  }
  return claims;
}

/** Relative API path usable behind the Next proxy. */
export function buildSignedDownloadPath(token: string): string {
  return `/api/v1/files/signed-download?token=${encodeURIComponent(token)}`;
}
