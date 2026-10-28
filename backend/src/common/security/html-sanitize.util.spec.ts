import { sanitizeEmailHtml } from './html-sanitize.util';

describe('sanitizeEmailHtml', () => {
  it('strips script tags and event handlers', () => {
    const dirty = `<p onclick="alert(1)">Hi</p><script>alert(2)</script><a href="javascript:alert(3)">x</a>`;
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).toMatch(/Hi/);
  });

  it('removes iframe and base tags', () => {
    const dirty = `<base href="https://evil.test/"><iframe src="https://evil.test"></iframe><p>Job</p>`;
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toMatch(/iframe/i);
    expect(clean).not.toMatch(/<base/i);
    expect(clean).toMatch(/Job/);
  });
});
