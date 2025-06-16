import { Injectable } from '@nestjs/common';
import { lookup as mimeLookup, extension as mimeExtension } from 'mime-types';
import { getDocument } from 'pdfjs-dist';

@Injectable()
export class OcrModuleService {
  async getFileFormat(fileBlob: Buffer): Promise<string | Error> {
    const fileSignature = fileBlob.slice(0, 4).toString('hex');

    const signatures: { [key: string]: string } = {
      '89504e47': 'image/png',
      ffd8ffe0: 'image/jpeg',
      ffd8ffe1: 'image/jpeg',
      '25504446': 'application/pdf',
      '504b0304': 'application/zip',
    };

    const mime = signatures[fileSignature];
    if (!mime) {
      return new Error('File type could not be determined');
    }

    const ext = mimeExtension(mime);
    return ext || new Error('Extension could not be determined');
  }

  async convertPdfToText(fileBlob: Buffer): Promise<string> {
    const loadingTask = getDocument({ data: fileBlob });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => (item as any).str);
      fullText += strings.join(' ') + '\n';
    }
    return fullText;
  }
}
