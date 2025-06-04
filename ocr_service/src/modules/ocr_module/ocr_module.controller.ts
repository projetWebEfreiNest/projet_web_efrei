import { Controller } from '@nestjs/common';
import { OcrModuleService } from './ocr_module.service';
import { MessagePattern } from '@nestjs/microservices';
import SUPPORTED_IMAGE_FORMATS from 'src/shared/consts/supported_images_formats';

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
      !Object.values(SUPPORTED_IMAGE_FORMATS).includes(
        fileFormat as SUPPORTED_IMAGE_FORMATS,
      )
    ) {
      return { error: 'Unsupported file format' };
    }

    let text: string;

    if (fileFormat === SUPPORTED_IMAGE_FORMATS.PDF) {
      text = await this.ocrModuleService.convertPdfToText(data.file);
    } else {
      text = await this.ocrModuleService.convertImageToText(data.file);
    }
  }
}
