import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TextTreatmentService } from './service/text_treatment_module.service';
import { TextTreatmentController } from './controller/text_treatment_module.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PUBLIC_API_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL || 'amqp://root:root@rabbitmq:5672'],
          queue: 'invoice_data_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [TextTreatmentController],
  providers: [TextTreatmentService],
})
export class TextTreatmentModule {}
