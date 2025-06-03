import { Module } from '@nestjs/common';
import { OcrModuleService } from './ocr_module.service';
import { OcrModuleController } from './ocr_module.controller';

@Module({
  controllers: [OcrModuleController],
  providers: [OcrModuleService],
})
export class OcrModuleModule {}
