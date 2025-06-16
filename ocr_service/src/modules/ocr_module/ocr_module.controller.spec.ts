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
import { OcrModuleController } from './ocr_module.controller';
import { OcrModuleService } from './ocr_module.service';
import { readFileSync } from 'fs';
import { join } from 'path';

const sampleFilePath = './sample_invoice.pdf';
const sampleFileBlob = readFileSync(join(__dirname, sampleFilePath));

describe('OcrModuleController', () => {
  let controller: OcrModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrModuleController],
      providers: [OcrModuleService],
    }).compile();

    controller = module.get<OcrModuleController>(OcrModuleController);
  });

  it('should convert pdf invoice to text', async () => {
    const convertedText = await controller.convertInvoiceToText({
      file: sampleFileBlob,
      invoiceId: '12345',
    });
    console.log('Converted Text:', convertedText);
    expect(convertedText).toBeDefined();
    expect(convertedText.text).toContain('Mocked PDF text');
  });
});
