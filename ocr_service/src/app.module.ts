import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OcrModuleResolver } from './modules/ocr_module/ocr_module.resolver';
import { OcrModuleModule } from './modules/ocr_module/ocr_module.module';

@Module({
  imports: [OcrModuleModule],
  controllers: [AppController],
  providers: [AppService, OcrModuleResolver],
})
export class AppModule {}
