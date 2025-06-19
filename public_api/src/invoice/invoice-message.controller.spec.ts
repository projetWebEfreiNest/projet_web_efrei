import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceMessageController } from './invoice-message.controller';
import { InvoiceService } from './invoice.service';
import { RabbitMQService } from './rabbitmq.service';

describe('InvoiceMessageController', () => {
  let controller: InvoiceMessageController;
  let invoiceService: InvoiceService;
  let rabbitMQService: RabbitMQService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const mockInvoiceService = {
    updateInvoiceStatus: jest.fn(),
    addInvoiceData: jest.fn(),
  };

  const mockRabbitMQService = {
    sendToTextTreatment: jest.fn(),
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceMessageController],
      providers: [
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceMessageController>(InvoiceMessageController);
    invoiceService = module.get<InvoiceService>(InvoiceService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleOCRResult', () => {
    it('should process OCR result successfully', async () => {
      const data = {
        invoice_id: 123,
        content: 'Extracted text from invoice',
      };

      mockRabbitMQService.sendToTextTreatment.mockResolvedValue(undefined);

      await controller.handleOCRResult(data);

      expect(consoleLogSpy).toHaveBeenCalledWith('Received OCR result:', data);
      expect(mockRabbitMQService.sendToTextTreatment).toHaveBeenCalledWith(
        data.invoice_id,
        data.content,
      );
    });

    it('should handle errors and update invoice status', async () => {
      const data = {
        invoice_id: 123,
        content: 'Extracted text from invoice',
      };

      mockRabbitMQService.sendToTextTreatment.mockRejectedValue(
        new Error('Text treatment service error'),
      );
      mockInvoiceService.updateInvoiceStatus.mockResolvedValue(undefined);

      await controller.handleOCRResult(data);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing OCR result:',
        expect.any(Error),
      );
      expect(mockInvoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        data.invoice_id,
        'ERROR',
      );
    });
  });

  describe('handleInvoiceData', () => {
    it('should process invoice data successfully', async () => {
      const data = {
        invoice_id: 456,
        content: 'Processed invoice content',
        amount: 1234.56,
      };

      mockInvoiceService.addInvoiceData.mockResolvedValue(undefined);

      await controller.handleInvoiceData(data);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Received invoice data:',
        data,
      );
      expect(mockInvoiceService.addInvoiceData).toHaveBeenCalledWith(
        data.invoice_id,
        data.content,
        data.amount,
      );
    });

    it('should handle errors when processing invoice data', async () => {
      const data = {
        invoice_id: 456,
        content: 'Processed invoice content',
        amount: 1234.56,
      };

      mockInvoiceService.addInvoiceData.mockRejectedValue(
        new Error('Database update error'),
      );
      mockInvoiceService.updateInvoiceStatus.mockResolvedValue(undefined);

      await controller.handleInvoiceData(data);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error adding invoice data:',
        expect.any(Error),
      );
      expect(mockInvoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        data.invoice_id,
        'ERROR',
      );
    });
  });
});
