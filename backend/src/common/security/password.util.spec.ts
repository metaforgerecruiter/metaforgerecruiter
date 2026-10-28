import * as bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';
import {
  hashPasswordArgon2id,
  verifyAndMigratePassword,
  ARGON2ID_CONFIG,
} from './password.util';

describe('Password Security & 2026 Baseline Migration (Argon2id)', () => {
  const plainPassword = 'SuperSecurePassword2026!';

  it('hashes password with Argon2id using 2026 Baseline parameters', async () => {
    const hash = await hashPasswordArgon2id(plainPassword);
    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    // Verify using argon2 native
    const isValid = await argon2.verify(hash, plainPassword);
    expect(isValid).toBe(true);
  });

  it('verifies Argon2id hash without requiring rehash', async () => {
    const argonHash = await hashPasswordArgon2id(plainPassword);
    const result = await verifyAndMigratePassword(plainPassword, argonHash);
    expect(result.isValid).toBe(true);
    expect(result.needsRehash).toBe(false);
  });

  it('verifies legacy bcrypt hash and signals needsRehash = true for silent migration', async () => {
    const salt = await bcrypt.genSalt(10);
    const legacyBcryptHash = await bcrypt.hash(plainPassword, salt);
    expect(legacyBcryptHash.startsWith('$2')).toBe(true);

    const result = await verifyAndMigratePassword(plainPassword, legacyBcryptHash);
    expect(result.isValid).toBe(true);
    expect(result.needsRehash).toBe(true);
  });

  it('rejects invalid password against both Argon2id and bcrypt hashes', async () => {
    const argonHash = await hashPasswordArgon2id(plainPassword);
    const wrongArgon = await verifyAndMigratePassword('WrongPassword!', argonHash);
    expect(wrongArgon.isValid).toBe(false);

    const salt = await bcrypt.genSalt(10);
    const bcryptHash = await bcrypt.hash(plainPassword, salt);
    const wrongBcrypt = await verifyAndMigratePassword('WrongPassword!', bcryptHash);
    expect(wrongBcrypt.isValid).toBe(false);
  });

  it('handles empty or malformed hash safely', async () => {
    const emptyResult = await verifyAndMigratePassword(plainPassword, '');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.needsRehash).toBe(false);

    const malformedResult = await verifyAndMigratePassword(plainPassword, 'malformed-hash');
    expect(malformedResult.isValid).toBe(false);
    expect(malformedResult.needsRehash).toBe(false);
  });
});
