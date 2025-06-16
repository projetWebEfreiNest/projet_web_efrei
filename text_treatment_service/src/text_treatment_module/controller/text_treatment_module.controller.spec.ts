import { Test, TestingModule } from '@nestjs/testing';
import { TextTreatmentController } from './text_treatment_module.controller';
import { TextTreatmentService } from '../service/text_treatment_module.service';
import OpenAI from 'openai';

jest.mock('openai');

describe('TextTreatmentController', () => {
  let controller: TextTreatmentController;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    mockCreate = jest.fn();
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextTreatmentController],
      providers: [TextTreatmentService],
    }).compile();

    controller = module.get(TextTreatmentController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('retourne le résultat parsé via le controller (success)', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ content: 'INT OK', amount: 42 }),
          },
        },
      ],
    });

    const res = await controller.analyzeText({
      invoice_id: 'I-1',
      content: 'texte pour intégration',
    });
    expect(res).toEqual({
      invoice_id: 'I-1',
      result: { content: 'INT OK', amount: 42 },
    });
  });

  it('retourne le fallback via le controller (échec OpenAI)', async () => {
    mockCreate.mockRejectedValueOnce(new Error('fail'));
    const res = await controller.analyzeText({
      invoice_id: 'I-2',
      content: 'test erreur',
    });
    expect(res).toEqual({
      invoice_id: 'I-2',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});
