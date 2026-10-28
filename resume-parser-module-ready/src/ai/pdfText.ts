import { PDFParse } from 'pdf-parse';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();
    const text = result?.text?.trim() || '';
    if (text.length > 40) return text;
  } catch (err: any) {
    console.warn('PDF text extraction failed:', err?.message || err);
  }

  try {
    const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as any;
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useSystemFonts: true,
      isEvalSupported: false,
    }).promise;
    let allText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageStr = content.items
        .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
        .filter(Boolean)
        .join(' ');
      allText += pageStr + '\n';
    }
    return allText.trim();
  } catch (e: any) {
    console.warn('PDF.js fallback text extraction failed:', e?.message || e);
    return '';
  }
}
