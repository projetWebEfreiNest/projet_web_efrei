import { Injectable } from '@nestjs/common';
import { lookup as mimeLookup, extension as mimeExtension } from 'mime-types';
import * as Tesseract from 'tesseract.js';
import * as pdfParse from 'pdf-parse';

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
    const data = await pdfParse(fileBlob);
    return data.text;
  }

  async convertImageToText(fileBlob: Buffer): Promise<string> {
    //TODO: multilanguage support
    const { data } = await Tesseract.recognize(fileBlob, 'fr');
    return data.text;
  }
}
