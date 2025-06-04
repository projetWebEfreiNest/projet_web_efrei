import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'OCR_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_OCR_URL],
          queue: process.env.RMQ_OCR_QUEUE,
          queueOptions: { durable: false },
        },
      },
      {
        name: 'TEXT_TREATMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_TREATMENT_URL],
          queue: process.env.RMQ_TREATMENT_QUEUE,
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
