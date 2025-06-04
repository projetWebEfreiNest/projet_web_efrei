import { Injectable } from '@nestjs/common';

import * as Tesseract from 'tesseract.js';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class OcrModuleService {
  async getFileFormat(fileBlob: Buffer): Promise<string | Error> {
    // const type = await fileType.fileTypeFromBuffer(fileBlob);
    // if (!type) {
    //   return new Error('File type could not be determined');
    // }
    return 'type.ext';
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
