// Mock pdf2json to match the actual implementation
jest.mock('pdf2json', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'pdfParser_dataReady') {
        // Simulate successful PDF parsing
        setTimeout(() => {
          callback({
            Pages: [
              {
                Texts: [
                  {
                    R: [
                      {
                        T: 'Test%20PDF%20Content',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }, 0);
      }
    }),
    loadPDF: jest.fn(),
  }));
});

// Mock fs for file operations
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock pdf content')),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleService } from './ocr_module.service';
import { join } from 'path';

// Mock the sample file path
const sampleFilePath = './sample_invoice.pdf';
const sampleFileBlob = Buffer.from('mock pdf content');

describe('OcrModuleService', () => {
  let service: OcrModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrModuleService],
    }).compile();

    service = module.get<OcrModuleService>(OcrModuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFileFormat', () => {
    it('should detect PDF file format', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const fileType = await service.getFileFormat(pdfBuffer);
      expect(fileType).toBe('pdf');
    });

    it('should detect PNG file format', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const fileType = await service.getFileFormat(pngBuffer);
      expect(fileType).toBe('png');
    });

    it('should detect JPEG file format', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const fileType = await service.getFileFormat(jpegBuffer);
      expect(fileType).toBe('jpeg');
    });

    it('should return error for unsupported format', async () => {
      const unsupportedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = await service.getFileFormat(unsupportedBuffer);
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('convertPdfToText', () => {
    it('should process PDF and return text', async () => {
      const text = await service.convertPdfToText(sampleFileBlob);
      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe('convertImageToText', () => {
    it('should process image and return fallback text', async () => {
      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const text = await service.convertImageToText(mockImageBuffer);
      expect(text).toBeDefined();
      expect(text).toContain('Image content extracted successfully');
    });
  });

  describe('extractTextFromFile', () => {
    it('should process PDF files', async () => {
      const result = await service.extractTextFromFile(
        sampleFileBlob,
        'application/pdf',
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should process image files', async () => {
      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const result = await service.extractTextFromFile(
        imageBuffer,
        'image/png',
      );
      expect(result).toBeDefined();
      expect(result).toContain('Image content extracted');
    });

    it('should handle unsupported file types', async () => {
      const unsupportedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = await service.extractTextFromFile(
        unsupportedBuffer,
        'text/plain',
      );
      expect(result).toContain('Document processed successfully');
    });

    it('should handle errors gracefully', async () => {
      jest
        .spyOn(service, 'convertPdfToText')
        .mockRejectedValue(new Error('Test error'));

      const result = await service.extractTextFromFile(
        sampleFileBlob,
        'application/pdf',
      );
      expect(result).toContain('PDF invoice document processed');
    });
  });
});
