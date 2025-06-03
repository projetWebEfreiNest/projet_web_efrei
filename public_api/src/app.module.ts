import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'OCR_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://user:password@rabbitmq:5672'],
          queue: 'ocr_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'TEXT_TREATMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://user:password@rabbitmq:5672'],
          queue: 'text_treatment_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
