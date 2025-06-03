import { Controller } from '@nestjs/common';
import { OcrModuleService } from './ocr_module.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class OcrModuleController {
  constructor(private readonly ocrModuleService: OcrModuleService) {}

  @MessagePattern('convert_invoice_to_text')
  async convertInvoiceToText(data: { file: Buffer; invoiceId: string }) {
    const fileFormat = await this.ocrModuleService.getFileFormat(data.file);

    if (fileFormat instanceof Error) {
      return { error: fileFormat.message };
    }

    if (fileFormat === 'pdf') {
      return this.ocrModuleService.convertPdfToText(data.file);
    }
  }
}
