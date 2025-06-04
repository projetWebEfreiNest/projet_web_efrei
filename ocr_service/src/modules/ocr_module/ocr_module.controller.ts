import { Controller } from '@nestjs/common';
import { OcrModuleService } from './ocr_module.service';
import { MessagePattern } from '@nestjs/microservices';
import { SUPPORTED_FILES_FORMATS } from '../../shared/consts/supported_files_formats';

@Controller()
export class OcrModuleController {
  constructor(private readonly ocrModuleService: OcrModuleService) {}

  @MessagePattern('convert_invoice_to_text')
  async convertInvoiceToText(data: { file: Buffer; invoiceId: string }) {
    const fileFormat = await this.ocrModuleService.getFileFormat(data.file);

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

    const result = await this.ocrModuleService.convertPdfToText(data.file);

    if (typeof result !== 'string') {
      return { error: result };
    }

    return {
      invoiceId: data.invoiceId,
      text: result,
      fileFormat: fileFormat as SUPPORTED_FILES_FORMATS,
    };
  }
}
