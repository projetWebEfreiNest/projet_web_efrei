import { Injectable } from '@nestjs/common';
import * as fileType from 'file-type';

@Injectable()
export class OcrModuleService {
  readonly supportedFileFormats = ['pdf', 'png', 'jpg', 'jpeg'];

  async getFileFormat(fileBlob: Buffer): Promise<string | Error> {
    const type = await fileType.fileTypeFromBuffer(fileBlob);
    if (!type) {
      return new Error('File type could not be determined');
    }
    if (!this.supportedFileFormats.includes(type.ext)) {
      return new Error(`Unsupported file format: ${type.ext}`);
    }
    return type.ext;
  }

  async convertPdfToText(fileBlob: Buffer): Promise<string> {
    return 'Extracted text from PDF';
  }

  async convertImageToText(fileBlob: Buffer): Promise<string> {
    return 'Extracted text from image';
  }
}
