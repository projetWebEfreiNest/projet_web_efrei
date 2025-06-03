import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://user:password@rabbitmq:5672'],
      queue: 'ocr_queue',
      queueOptions: {
        durable: false
      },
    },
  });
  await app.listen();
}
bootstrap();
