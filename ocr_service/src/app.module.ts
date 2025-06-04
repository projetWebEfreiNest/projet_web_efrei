import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OcrModuleModule } from './modules/ocr_module/ocr_module.module';

@Module({
  imports: [OcrModuleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
