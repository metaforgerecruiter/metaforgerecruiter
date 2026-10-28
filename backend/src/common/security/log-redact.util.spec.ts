import { redactSecretString, redactSecrets, isSensitiveKey, REDACTED } from './log-redact.util';

describe('log-redact.util', () => {
  it('flags sensitive keys', () => {
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('accessToken')).toBe(true);
    expect(isSensitiveKey('refresh_token')).toBe(true);
    expect(isSensitiveKey('email')).toBe(false);
  });

  it('redacts object secrets', () => {
    const out = redactSecrets({
      email: 'a@b.com',
      password: 'Admin@2026',
      token: 'abc',
      nested: { refreshToken: 'xyz', role: 'admin' },
    });
    expect(out.email).toBe('a@b.com');
    expect(out.password).toBe(REDACTED);
    expect(out.token).toBe(REDACTED);
    expect(out.nested.refreshToken).toBe(REDACTED);
    expect(out.nested.role).toBe('admin');
  });

  it('redacts JWT-like and bearer strings', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signaturehere';
    expect(redactSecretString(`Bearer ${jwt}`)).toContain(REDACTED);
    expect(redactSecretString(`password=${jwt}`)).toContain(REDACTED);
  });
});
