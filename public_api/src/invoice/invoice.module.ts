import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceResolver } from './invoice.resolver';
import { InvoiceController } from './invoice.controller';
import { InvoiceMessageController } from './invoice-message.controller';
import { S3Service } from './s3.service';
import { RabbitMQService } from './rabbitmq.service';
import { PrismaModule } from '../prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'OCR_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_OCR_URL || 'amqp://root:root@localhost:5672'],
          queue: 'ocr_queue',
          queueOptions: { durable: false },
        },
      },
      {
        name: 'TEXT_TREATMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RMQ_TEXT_TREATMENT_URL ||
              'amqp://root:root@localhost:5672',
          ],
          queue: 'text_treatment_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [InvoiceController, InvoiceMessageController],
  providers: [InvoiceResolver, InvoiceService, S3Service, RabbitMQService],
})
export class InvoiceModule {}
