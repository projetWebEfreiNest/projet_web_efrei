import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Transport, ClientProxy, ClientsModule } from '@nestjs/microservices';

describe('AppController (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'TEST_SERVICE',
            transport: Transport.RMQ,
            options: {
              urls: ['amqp://localhost:5672'],
              queue: 'text_treatment_queue',
              queueOptions: { durable: false },
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'text_treatment_queue',
        queueOptions: { durable: false },
      },
    });

    client = moduleFixture.get('TEST_SERVICE');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await client.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
