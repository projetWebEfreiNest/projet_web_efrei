import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitMQService {
  constructor(
    @Inject('OCR_SERVICE') private ocrClient: ClientProxy,
    @Inject('TEXT_TREATMENT_SERVICE') private textTreatmentClient: ClientProxy,
  ) {}

  async sendToOCR(invoiceId: number, fileBuffer: Buffer, fileName: string) {
    const message = {
      invoice_id: invoiceId,
      content: fileBuffer.toString('base64'),
      fileName,
    };

    this.ocrClient.emit('process_invoice', message);
    console.log(`Sent invoice ${invoiceId} to OCR service`);
  }

  async sendToTextTreatment(invoiceId: number, content: string) {
    const message = {
      invoice_id: invoiceId,
      content,
    };

    this.textTreatmentClient.emit('analyze_invoice', message);
    console.log(`Sent invoice ${invoiceId} to text treatment service`);
  }
}
