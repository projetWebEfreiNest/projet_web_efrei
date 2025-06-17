import { Controller } from '@nestjs/common';
import { OcrModuleService } from './ocr_module.service';
import { MessagePattern } from '@nestjs/microservices';
import { SUPPORTED_FILES_FORMATS } from '../../shared/consts/supported_files_formats';

@Controller()
export class OcrModuleController {
  constructor(private readonly ocrModuleService: OcrModuleService) {}

  @MessagePattern('convert_invoice_to_text')
  async convertInvoiceToText(data: any) {
    const fileBlob = Buffer.from(data.content, 'base64');

    const fileFormat = await this.ocrModuleService.getFileFormat(fileBlob);

    if (fileFormat instanceof Error) {
      return { error: fileFormat.message };
    }

    if (
      !Object.values(SUPPORTED_FILES_FORMATS).includes(
        fileFormat as SUPPORTED_FILES_FORMATS,
      )
    ) {
      return { error: 'Unsupported file format' };
    }

    const extractedText =
      await this.ocrModuleService.convertPdfToText(fileBlob);

    if (typeof extractedText !== 'string') {
      return { error: extractedText };
    }

    return {
      content: extractedText,
      fileFormat: fileFormat as SUPPORTED_FILES_FORMATS,
    };
  }
}
