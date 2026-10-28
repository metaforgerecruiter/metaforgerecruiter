import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

/**
 * OWASP 2026 Baseline Argon2id configuration
 * Memory: 19 MiB (19456 KiB)
 * Iterations: 2
 * Parallelism: 1
 */
export const ARGON2ID_CONFIG: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB in KiB
  timeCost: 2,       // 2 iterations
  parallelism: 1,    // 1 lane
};

/**
 * Hash password with Argon2id using 2026 Baseline parameters
 */
export async function hashPasswordArgon2id(plain: string): Promise<string> {
  return argon2.hash(plain, {
    ...ARGON2ID_CONFIG,
    raw: false,
  });
}

/**
 * Dual-verification:
 * - If hash starts with $argon2, verifies using argon2.verify
 * - If hash starts with $2 (legacy bcrypt), verifies using bcrypt.compare and signals needsRehash = true
 */
export async function verifyAndMigratePassword(
  plain: string,
  storedHash: string,
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!storedHash || !plain) {
    return { isValid: false, needsRehash: false };
  }

  // 1. Argon2 verification
  if (storedHash.startsWith('$argon2')) {
    try {
      const isValid = await argon2.verify(storedHash, plain);
      return { isValid, needsRehash: false };
    } catch {
      return { isValid: false, needsRehash: false };
    }
  }

  // 2. Legacy Bcrypt verification
  if (storedHash.startsWith('$2')) {
    try {
      const isValid = await bcrypt.compare(plain, storedHash);
      return { isValid, needsRehash: isValid };
    } catch {
      return { isValid: false, needsRehash: false };
    }
  }

  return { isValid: false, needsRehash: false };
}
