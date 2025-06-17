import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TextTreatmentService } from '../service/text_treatment_module.service';

@Controller()
export class TextTreatmentController {
  constructor(private readonly service: TextTreatmentService) {}

  @MessagePattern('analyze_invoice')
  async analyzeInvoice(data: { invoice_id: number; content: string }) {
    return this.service.analyze(data.invoice_id.toString(), data.content);
  }
}
