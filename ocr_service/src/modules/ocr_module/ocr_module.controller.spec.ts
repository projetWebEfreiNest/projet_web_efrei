import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleController } from './ocr_module.controller';
import { OcrModuleService } from './ocr_module.service';

describe('OcrModuleController', () => {
  let controller: OcrModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrModuleController],
      providers: [OcrModuleService],
    }).compile();

    controller = module.get<OcrModuleController>(OcrModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
