import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RMQ_URL],
        queue: process.env.RMQ_OCR_QUEUE,
        queueOptions: {
          durable: false,
        },
        exchange: 'broadcast_exchange',
        exchangeType: 'fanout',
      },
    },
  );
  await app.listen();
}
bootstrap();
