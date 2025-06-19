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
        urls: [process.env.RMQ_URL || 'amqp://root:root@rabbitmq:5672'],
        queue: 'ocr_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.listen();

  const fakeApp = await NestFactory.create(AppModule);
  await fakeApp.listen(process.env.PORT || 3001);
}
bootstrap();
