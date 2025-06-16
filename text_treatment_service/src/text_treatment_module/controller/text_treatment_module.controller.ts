import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TextTreatmentService } from '../service/text_treatment_module.service';

@Controller()
export class TextTreatmentController {
  constructor(private readonly service: TextTreatmentService) {}

  @MessagePattern('analyze_invoice_text')
  async analyzeText(data: { invoice_id: string; content: string }) {
    return this.service.analyze(data.invoice_id, data.content);
  }
}
