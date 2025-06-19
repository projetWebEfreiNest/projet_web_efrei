// Mock dependencies
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer) => {
    if (buffer.length === 0) {
      throw new Error('Empty buffer');
    }
    return Promise.resolve({
      text: 'Invoice Test Document\nAmount: $1,234.56\nDate: 2025-06-17\nDescription: Web Development Services',
    });
  });
});

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: 'INVOICE\nAmount: $2,500.00\nDate: June 17, 2025\nServices: Software Development',
      },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleController } from '../src/modules/ocr_module/ocr_module.controller';
import { OcrModuleService } from '../src/modules/ocr_module/ocr_module.service';
import { ClientProxy } from '@nestjs/microservices';

describe('OCR Workflow Integration', () => {
  let controller: OcrModuleController;
  let service: OcrModuleService;
  let mockTextTreatmentClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    mockTextTreatmentClient = {
      emit: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      connect: jest.fn(),
    } as any;

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

  describe('Complete PDF Workflow', () => {
    it('should process PDF invoice and send to text treatment', async () => {
      // Create mock PDF buffer
      const pdfBuffer = Buffer.from([
        0x25,
        0x50,
        0x44,
        0x46,
        ...Array(100).fill(0),
      ]);

      const invoiceData = {
        invoice_id: 123,
        content: pdfBuffer.toString('base64'),
        fileName: 'test_invoice.pdf',
      };

      const result = await controller.processInvoice(invoiceData);

      // Verify successful processing
      expect(result).toBeDefined();
      expect(result.invoice_id).toBe(123);
      expect(result.content).toContain('Invoice Test Document');
      expect(result.content).toContain('$1,234.56');
      expect(result.fileFormat).toBe('pdf');

      // Verify message sent to text treatment service
      expect(mockTextTreatmentClient.emit).toHaveBeenCalledWith(
        'analyze_invoice',
        {
          invoice_id: 123,
          content: expect.stringContaining('Invoice Test Document'),
        },
      );
    });
  });

  describe('Complete Image OCR Workflow', () => {
    it('should process image invoice with OCR and send to text treatment', async () => {
      // Create mock PNG buffer
      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        ...Array(100).fill(0),
      ]);

      const invoiceData = {
        invoice_id: 456,
        content: pngBuffer.toString('base64'),
        fileName: 'invoice_scan.png',
      };

      const result = await controller.processInvoice(invoiceData);

      // Verify successful OCR processing
      expect(result).toBeDefined();
      expect(result.invoice_id).toBe(456);
      expect(result.content).toContain('INVOICE');
      expect(result.content).toContain('$2,500.00');
      expect(result.fileFormat).toBe('png');

      // Verify message sent to text treatment service
      expect(mockTextTreatmentClient.emit).toHaveBeenCalledWith(
        'analyze_invoice',
        {
          invoice_id: 456,
          content: expect.stringContaining('INVOICE'),
        },
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle corrupted PDF files', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('Corrupted PDF'));

      const corruptedBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const invoiceData = {
        invoice_id: 789,
        content: corruptedBuffer.toString('base64'),
        fileName: 'corrupted.pdf',
      };

      const result = await controller.processInvoice(invoiceData);

      expect(result.error).toBe('Error extracting text from PDF');
      expect(mockTextTreatmentClient.emit).not.toHaveBeenCalled();
    });

    it('should handle OCR failures gracefully', async () => {
      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce({
        recognize: jest.fn().mockRejectedValue(new Error('OCR failed')),
        terminate: jest.fn().mockResolvedValue(undefined),
      });

      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const invoiceData = {
        invoice_id: 999,
        content: imageBuffer.toString('base64'),
        fileName: 'unreadable_image.png',
      };

      const result = await controller.processInvoice(invoiceData);

      expect(result.error).toBe('Error extracting text from image');
      expect(mockTextTreatmentClient.emit).not.toHaveBeenCalled();
    });

    it('should reject files that are too small', async () => {
      const tinyBuffer = Buffer.from([0x25, 0x50]);
      const invoiceData = {
        invoice_id: 111,
        content: tinyBuffer.toString('base64'),
        fileName: 'tiny.pdf',
      };

      const result = await controller.processInvoice(invoiceData);

      expect(result.error).toBeDefined();
      expect(mockTextTreatmentClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('File Format Detection', () => {
    it('should correctly identify different file formats', async () => {
      const testCases = [
        { buffer: [0x25, 0x50, 0x44, 0x46], expected: 'pdf' },
        { buffer: [0x89, 0x50, 0x4e, 0x47], expected: 'png' },
        { buffer: [0xff, 0xd8, 0xff, 0xe0], expected: 'jpeg' },
        { buffer: [0xff, 0xd8, 0xff, 0xe1], expected: 'jpeg' },
      ];

      for (const testCase of testCases) {
        const buffer = Buffer.from(testCase.buffer);
        const result = await service.getFileFormat(buffer);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should reject unsupported file formats', async () => {
      const unsupportedFormats = [
        [0x50, 0x4b, 0x03, 0x04], // ZIP
        [0x00, 0x01, 0x02, 0x03], // Unknown
        [0x42, 0x4d], // BMP (not supported)
      ];

      for (const formatBytes of unsupportedFormats) {
        const buffer = Buffer.from(formatBytes);
        const result = await service.getFileFormat(buffer);
        expect(result).toBeInstanceOf(Error);
      }
    });
  });
});
