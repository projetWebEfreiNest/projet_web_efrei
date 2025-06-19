// Mock dependencies for e2e tests
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'E2E test PDF content',
  });
});

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({
      data: { text: 'E2E test OCR content' },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

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

  describe('OcrModuleService Integration', () => {
    it('should detect PDF file format correctly', async () => {
      // PDF file signature
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = await ocrService.getFileFormat(pdfBuffer);
      expect(result).toBe('pdf');
    });

    it('should detect image file formats correctly', async () => {
      // PNG signature
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const pngResult = await ocrService.getFileFormat(pngBuffer);
      expect(pngResult).toBe('png');

      // JPEG signature
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const jpegResult = await ocrService.getFileFormat(jpegBuffer);
      expect(jpegResult).toBe('jpeg');
    });

    it('should extract text from PDF files', async () => {
      const mockPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = await ocrService.extractTextFromFile(
        mockPdfBuffer,
        'application/pdf',
      );
      expect(result).toContain('E2E test PDF content');
    });

    it('should extract text from image files using OCR', async () => {
      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const result = await ocrService.extractTextFromFile(
        mockImageBuffer,
        'image/png',
      );
      expect(result).toContain('E2E test OCR content');
    });

    it('should handle unsupported file types gracefully', async () => {
      const unsupportedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = await ocrService.extractTextFromFile(
        unsupportedBuffer,
        'text/plain',
      );
      expect(result).toBe('Unsupported file type for text extraction');
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF parsing errors', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockRejectedValueOnce(new Error('PDF processing failed'));

      const mockPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = await ocrService.convertPdfToText(mockPdfBuffer);
      expect(result).toBe('Error extracting text from PDF');
    });

    it('should handle OCR processing errors', async () => {
      const { createWorker } = require('tesseract.js');
      createWorker.mockResolvedValueOnce({
        recognize: jest
          .fn()
          .mockRejectedValue(new Error('OCR processing failed')),
        terminate: jest.fn().mockResolvedValue(undefined),
      });

      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const result = await ocrService.convertImageToText(mockImageBuffer);
      expect(result).toBe('Error extracting text from image');
    });
  });
});
