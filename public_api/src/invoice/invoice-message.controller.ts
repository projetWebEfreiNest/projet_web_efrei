import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvoiceService } from './invoice.service';
import { RabbitMQService } from './rabbitmq.service';

@Controller()
export class InvoiceMessageController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  @MessagePattern('ocr_result')
  async handleOCRResult(
    @Payload() data: { invoice_id: number; content: string },
  ) {
    console.log('Received OCR result:', data);

    try {
      // Transférer le contenu extrait au text_treatment_service
      await this.rabbitMQService.sendToTextTreatment(
        data.invoice_id,
        data.content,
      );
    } catch (error) {
      console.error('Error processing OCR result:', error);
      await this.invoiceService.updateInvoiceStatus(data.invoice_id, 'ERROR');
    }
  }

  @MessagePattern('invoice_data')
  async handleInvoiceData(
    @Payload() data: { invoice_id: number; content: string; amount: number },
  ) {
    console.log('Received invoice data:', data);

    try {
      // Ajouter les données de facturation à la base
      await this.invoiceService.addInvoiceData(
        data.invoice_id,
        data.content,
        data.amount,
      );
    } catch (error) {
      console.error('Error adding invoice data:', error);
      await this.invoiceService.updateInvoiceStatus(data.invoice_id, 'ERROR');
    }
  }

  @MessagePattern('processing_error')
  async handleProcessingError(
    @Payload() data: { invoice_id: number; error: string },
  ) {
    console.log('Received processing error:', data);
    await this.invoiceService.updateInvoiceStatus(data.invoice_id, 'ERROR');
  }
}
