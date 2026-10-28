import mammoth from 'mammoth';

const SUPPORTED = ['pdf', 'docx', 'doc', 'txt'];

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isSupportedFile(filename: string): boolean {
  return SUPPORTED.includes(getExtension(filename));
}

export async function extractFileContent(
  buffer: Buffer,
  filename: string,
): Promise<{ type: 'pdf' | 'text'; data: string }> {
  const ext = getExtension(filename);

  if (ext === 'pdf') {
    return {
      type: 'pdf',
      data: buffer.toString('base64'),
    };
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value?.trim()) {
      throw new Error('No text found. File may be image-based or scanned.');
    }
    return { type: 'text', data: result.value };
  }

  if (ext === 'doc') {
    try {
      const WordExtractor = (await import('word-extractor')).default;
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      const text = doc.getBody()?.trim() || '';
      if (!text) {
        throw new Error('No text found. File may be image-based or empty.');
      }
      return { type: 'text', data: text };
    } catch (docErr: any) {
      throw new Error(`Failed to extract .doc file: ${docErr?.message || docErr}`);
    }
  }

  if (ext === 'txt') {
    return { type: 'text', data: buffer.toString('utf-8') };
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
