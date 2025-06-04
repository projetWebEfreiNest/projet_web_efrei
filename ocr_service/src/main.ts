import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          'amqps://zichyuad:hslzQgOdgVHN4UgbFZi9jpgiiJSW73GH@collie.lmq.cloudamqp.com/zichyuad',
        ],
        queue: 'ocr_queue',
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
