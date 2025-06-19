import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OcrModuleService } from './ocr_module.service';
import { OcrModuleController } from './ocr_module.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TEXT_TREATMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL || 'amqp://root:root@rabbitmq:5672'],
          queue: 'text_treatment_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [OcrModuleController],
  providers: [OcrModuleService],
})
export class OcrModuleModule {}
