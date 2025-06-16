import { Module } from '@nestjs/common';
import { TextTreatmentModule } from './text_treatment_module/text_treatment_module.module';

@Module({
  imports: [TextTreatmentModule],
})
export class AppModule {}
