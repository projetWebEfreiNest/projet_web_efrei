import { Test, TestingModule } from '@nestjs/testing';
import { OcrModuleController } from '../src/modules/ocr_module/ocr_module.controller';
import { OcrModuleService } from '../src/modules/ocr_module/ocr_module.service';

describe('OCR Workflow Integration', () => {
  let controller: OcrModuleController;
  let service: OcrModuleService;

  beforeEach(async () => {
    const mockTextTreatmentClient = {
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
