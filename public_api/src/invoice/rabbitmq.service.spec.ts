import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { ClientProxy } from '@nestjs/microservices';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let ocrClient: ClientProxy;
  let textTreatmentClient: ClientProxy;
  let consoleLogSpy: jest.SpyInstance;

  const mockOcrClient = {
    emit: jest.fn(),
  };

  const mockTextTreatmentClient = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQService,
        {
          provide: 'OCR_SERVICE',
          useValue: mockOcrClient,
        },
        {
          provide: 'TEXT_TREATMENT_SERVICE',
          useValue: mockTextTreatmentClient,
        },
      ],
    }).compile();

    service = module.get<RabbitMQService>(RabbitMQService);
    ocrClient = module.get<ClientProxy>('OCR_SERVICE');
    textTreatmentClient = module.get<ClientProxy>('TEXT_TREATMENT_SERVICE');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendToOCR', () => {
    it('should send invoice to OCR service', async () => {
      const invoiceId = 123;
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-invoice.pdf';

      await service.sendToOCR(invoiceId, fileBuffer, fileName);

      expect(mockOcrClient.emit).toHaveBeenCalledWith('process_invoice', {
        invoice_id: invoiceId,
        content: fileBuffer.toString('base64'),
        fileName,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sent invoice ${invoiceId} to OCR service`,
      );
    });
  });

  describe('sendToTextTreatment', () => {
    it('should send invoice to text treatment service', async () => {
      const invoiceId = 456;
      const content = 'Extracted text content from invoice';

      await service.sendToTextTreatment(invoiceId, content);

      expect(mockTextTreatmentClient.emit).toHaveBeenCalledWith(
        'analyze_invoice',
        {
          invoice_id: invoiceId,
          content,
        },
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Sent invoice ${invoiceId} to text treatment service`,
      );
    });
  });
});
