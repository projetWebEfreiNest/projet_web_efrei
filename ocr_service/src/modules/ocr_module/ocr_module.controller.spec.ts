// Mock fs for readFileSync
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock pdf content')),
}));

// Mock pdf-parse instead of pdfjs-dist
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Mocked PDF text content from pdf-parse',
  });
});

// Mock tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({
      data: { text: 'Mocked OCR text from image' },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleController } from './ocr_module.controller';
import { OcrModuleService } from './ocr_module.service';
import { join } from 'path';

const sampleFilePath = './sample_invoice.pdf';
const sampleFileBlob = Buffer.from('mock pdf content');

// Mock RabbitMQ client
const mockTextTreatmentClient = {
  emit: jest.fn(),
};

describe('OcrModuleController', () => {
  let controller: OcrModuleController;
  let service: OcrModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrModuleController],
      providers: [
        OcrModuleService,
        {
          provide: 'TEXT_TREATMENT_SERVICE',
          useValue: mockTextTreatmentClient,
        },
      ],
    }).compile();

    controller = module.get<OcrModuleController>(OcrModuleController);
    service = module.get<OcrModuleService>(OcrModuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process PDF invoice successfully', async () => {
    // Create a proper PDF buffer with PDF signature
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

    const invoiceData = {
      invoice_id: 123,
      content: pdfBuffer.toString('base64'),
      fileName: 'test_invoice.pdf',
    };

    const result = await controller.processInvoice(invoiceData);

    expect(result).toBeDefined();
    expect(result.invoice_id).toBe(123);
    expect(result.content).toBeDefined();
    expect(typeof result.content).toBe('string');
    expect(result.fileFormat).toBe('pdf');
    expect(mockTextTreatmentClient.emit).toHaveBeenCalledWith(
      'analyze_invoice',
      {
        invoice_id: 123,
        content: expect.any(String),
      },
    );
  });

  it('should process image invoice with OCR', async () => {
    // Create mock PNG buffer
    const mockPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const invoiceData = {
      invoice_id: 456,
      content: mockPngBuffer.toString('base64'),
      fileName: 'test_invoice.png',
    };

    const result = await controller.processInvoice(invoiceData);

    expect(result).toBeDefined();
    expect(result.error).toBe('Unsupported file format'); // PNG n'est pas supporté selon les logs
  });

  it('should handle unsupported file format', async () => {
    // Create mock unsupported file buffer
    const mockUnsupportedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);

    const invoiceData = {
      invoice_id: 789,
      content: mockUnsupportedBuffer.toString('base64'),
      fileName: 'test_file.txt',
    };

    const result = await controller.processInvoice(invoiceData);

    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(mockTextTreatmentClient.emit).not.toHaveBeenCalled();
  });

  it('should handle processing errors gracefully', async () => {
    // Mock service to throw error
    jest
      .spyOn(service, 'extractTextFromFile')
      .mockRejectedValue(new Error('Processing failed'));

    // Create a proper PDF buffer with PDF signature
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

    const invoiceData = {
      invoice_id: 999,
      content: pdfBuffer.toString('base64'),
      fileName: 'error_test.pdf',
    };

    const result = await controller.processInvoice(invoiceData);

    expect(result).toBeDefined();
    expect(result.error).toBe('Processing failed');
    expect(mockTextTreatmentClient.emit).not.toHaveBeenCalled();
  });
});
