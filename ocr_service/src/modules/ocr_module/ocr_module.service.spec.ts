jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Mocked PDF text' }],
        }),
      }),
    }),
  }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleService } from './ocr_module.service';
import { readFileSync } from 'fs';
import { join } from 'path';

const sampleFilePath = './sample_invoice.pdf';
const sampleFileBlob = readFileSync(join(__dirname, sampleFilePath));

describe('OcrModuleService', () => {
  let service: OcrModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrModuleService],
    }).compile();

    service = module.get<OcrModuleService>(OcrModuleService);
  });

  it('should return pdf fileType type', async () => {
    const fileType = await service.getFileFormat(sampleFileBlob);
    expect(fileType).toBe('pdf');
  });

  it('should convert pdf to text', async () => {
    const text = await service.convertPdfToText(sampleFileBlob);
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  });
});
