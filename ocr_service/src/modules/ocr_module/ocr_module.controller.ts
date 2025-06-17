import { Controller, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OcrModuleService } from './ocr_module.service';
import { MessagePattern } from '@nestjs/microservices';
import { SUPPORTED_FILES_FORMATS } from '../../shared/consts/supported_files_formats';

@Controller()
export class OcrModuleController {
  constructor(
    private readonly ocrModuleService: OcrModuleService,
    @Inject('TEXT_TREATMENT_SERVICE') private textTreatmentClient: ClientProxy,
  ) {}

  @MessagePattern('process_invoice')
  async processInvoice(data: {
    invoice_id: number;
    content: string;
    fileName: string;
  }) {
    console.log(
      `Processing invoice ${data.invoice_id} with file: ${data.fileName}`,
    );

    try {
      // Décoder le fichier base64
      const fileBlob = Buffer.from(data.content, 'base64');

      const fileFormat = await this.ocrModuleService.getFileFormat(fileBlob);

      if (fileFormat instanceof Error) {
        console.error(
          `File format error for invoice ${data.invoice_id}:`,
          fileFormat.message,
        );
        return { error: fileFormat.message };
      }

      if (
        !Object.values(SUPPORTED_FILES_FORMATS).includes(
          fileFormat as SUPPORTED_FILES_FORMATS,
        )
      ) {
        console.error(
          `Unsupported file format for invoice ${data.invoice_id}: ${fileFormat}`,
        );
        return { error: 'Unsupported file format' };
      }

      // Déterminer le type MIME pour l'extraction
      const mimeType =
        fileFormat === 'pdf'
          ? 'application/pdf'
          : fileFormat === 'png'
            ? 'image/png'
            : fileFormat === 'jpg' || fileFormat === 'jpeg'
              ? 'image/jpeg'
              : 'image/unknown';

      const extractedText = await this.ocrModuleService.extractTextFromFile(
        fileBlob,
        mimeType,
      );

      if (!extractedText || extractedText.includes('Error')) {
        console.error(
          `Text extraction failed for invoice ${data.invoice_id}:`,
          extractedText,
        );
        return { error: extractedText };
      }

      console.log(`Text extraction successful for invoice ${data.invoice_id}`);

      // Envoyer le texte extrait vers text_treatment_service
      this.textTreatmentClient.emit('analyze_invoice', {
        invoice_id: data.invoice_id,
        content: extractedText,
      });

      console.log(
        `Sent extracted text to text_treatment_service for invoice ${data.invoice_id}`,
      );

      return {
        invoice_id: data.invoice_id,
        content: extractedText,
        fileFormat: fileFormat as SUPPORTED_FILES_FORMATS,
      };
    } catch (error) {
      console.error(`Error processing invoice ${data.invoice_id}:`, error);
      return { error: 'Processing failed' };
    }
  }
}
