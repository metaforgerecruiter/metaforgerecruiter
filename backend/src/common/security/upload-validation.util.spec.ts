import { BadRequestException } from '@nestjs/common';
import {
  assertSafeUploadFilename,
  scanUploadBuffer,
  validateUploadedResume,
} from './upload-validation.util';

describe('upload-validation.util', () => {
  it('rejects path traversal / null bytes in filenames', () => {
    expect(() => assertSafeUploadFilename('../etc/passwd.pdf')).not.toThrow();
    expect(assertSafeUploadFilename('../etc/passwd.pdf')).toBe('passwd.pdf');
    expect(() => assertSafeUploadFilename('evil\0.pdf')).toThrow(BadRequestException);
  });

  it('rejects executable content disguised as pdf', () => {
    const pe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(() => scanUploadBuffer('resume.pdf', pe, 'application/pdf')).toThrow(BadRequestException);
  });

  it('accepts a minimal PDF header without active content', () => {
    const pdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    expect(() => scanUploadBuffer('resume.pdf', pdf, 'application/pdf')).not.toThrow();
  });

  it('rejects PDF with JavaScript action', () => {
    const pdf = Buffer.from('%PDF-1.4\n/JavaScript (app.alert(1))\n%%EOF\n');
    expect(() => scanUploadBuffer('resume.pdf', pdf, 'application/pdf')).toThrow(BadRequestException);
  });

  it('rejects EICAR signature', () => {
    const eicar = Buffer.from(
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
    );
    expect(() =>
      validateUploadedResume({ originalname: 'note.txt', mimetype: 'text/plain', buffer: eicar, size: eicar.length }),
    ).toThrow(BadRequestException);
  });
});
