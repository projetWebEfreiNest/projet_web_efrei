import { Test, TestingModule } from '@nestjs/testing';
import { TextTreatmentController } from './text_treatment_module.controller';
import { TextTreatmentService } from '../service/text_treatment_module.service';

describe('TextTreatmentModuleController', () => {
  let controller: TextTreatmentController;
  let service: TextTreatmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextTreatmentController],
      providers: [
        {
          provide: TextTreatmentService,
          useValue: {
            analyze: jest.fn().mockResolvedValue({
              invoice_id: 'X',
              result: { content: 'foo', amount: 1.23 },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TextTreatmentController>(TextTreatmentController);
    service = module.get<TextTreatmentService>(TextTreatmentService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('retourne le résultat de analyze()', async () => {
    await expect(service.analyze('ID', 'contenu')).resolves.toEqual({
      invoice_id: 'X',
      result: { content: 'foo', amount: 1.23 },
    });
    expect(service.analyze).toHaveBeenCalledWith('ID', 'contenu');
  });
});
