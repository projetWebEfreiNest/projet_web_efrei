import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OcrModuleService } from '../src/modules/ocr_module/ocr_module.service';

describe('OCR Service (e2e)', () => {
  let app: INestMicroservice;
  let ocrService: OcrModuleService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('TEXT_TREATMENT_SERVICE')
      .useValue({
        emit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'test_ocr_queue',
        queueOptions: { durable: false },
      },
    });

    ocrService = moduleFixture.get<OcrModuleService>(OcrModuleService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(ocrService).toBeDefined();
  });
});
