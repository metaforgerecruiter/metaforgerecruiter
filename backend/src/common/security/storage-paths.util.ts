import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_SEGMENTS = [
  `${path.sep}public${path.sep}`,
  `${path.sep}wwwroot${path.sep}`,
  `${path.sep}static${path.sep}`,
  `${path.sep}frontend${path.sep}public${path.sep}`,
  `${path.sep}_next${path.sep}`,
];

/**
 * Resolve STORAGE_ROOT outside any web-served directory.
 * Defaults to <cwd>/storage/private (not under frontend/public or Nest static).
 */
export function resolveStorageRoot(): string {
  const raw = (process.env.STORAGE_ROOT || '').trim();
  const abs = path.resolve(raw || path.join(process.cwd(), 'storage', 'private'));
  assertOutsideWebRoot(abs);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

export function resolveResumeStorageDir(orgId: string): string {
  const root = resolveStorageRoot();
  const safeOrg = String(orgId).replace(/[^a-fA-F0-9]/g, '') || 'unknown';
  const dir = path.join(root, 'resumes', safeOrg);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function assertOutsideWebRoot(absolutePath: string): void {
  const normalized = path.resolve(absolutePath).toLowerCase() + path.sep;
  for (const seg of FORBIDDEN_SEGMENTS) {
    if (normalized.includes(seg.toLowerCase())) {
      throw new Error(
        `STORAGE_ROOT must be outside the web root (rejected path containing "${seg.trim()}")`,
      );
    }
  }
}

/** Resolve a storage key under the root; reject path traversal. */
export function resolveStoredFilePath(storageKey: string): string {
  const root = resolveStorageRoot();
  const key = String(storageKey || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!key || key.includes('..') || path.isAbsolute(key)) {
    throw new Error('Invalid storage key');
  }
  const absolute = path.resolve(root, key);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (!absolute.toLowerCase().startsWith(rootWithSep.toLowerCase()) && absolute.toLowerCase() !== root.toLowerCase()) {
    throw new Error('Storage path escapes STORAGE_ROOT');
  }
  return absolute;
}
