import { Module } from '@nestjs/common';
import { TextTreatmentService } from './service/text_treatment_module.service';
import { TextTreatmentController } from './controller/text_treatment_module.controller';

@Module({
  controllers: [TextTreatmentController],
  providers: [TextTreatmentService],
})
export class TextTreatmentModule {}
