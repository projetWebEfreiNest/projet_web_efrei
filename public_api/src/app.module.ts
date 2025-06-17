import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { HelloResolver } from './hello.resolver';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { InvoiceModule } from './invoice/invoice.module';

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      path: '/graphql',
    }),
    AuthModule,
    PrismaModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService, HelloResolver],
})
export class AppModule {}
