import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleService } from './ocr_module.service';

describe('OcrModuleService', () => {
  let service: OcrModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrModuleService],
    }).compile();

    service = module.get<OcrModuleService>(OcrModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
