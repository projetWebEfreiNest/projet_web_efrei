import { Test, TestingModule } from '@nestjs/testing';
import { TextTreatmentController } from './text_treatment_module.controller';
import { TextTreatmentService } from '../service/text_treatment_module.service';
import OpenAI from 'openai';

jest.mock('openai');

describe('TextTreatmentController', () => {
  let controller: TextTreatmentController;
  let mockCreate: jest.Mock;
  let mockEmit: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockCreate = jest.fn();
    mockEmit = jest.fn();

    // Mock console methods to prevent CI issues
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextTreatmentController],
      providers: [
        TextTreatmentService,
        {
          provide: 'PUBLIC_API_SERVICE',
          useValue: {
            emit: mockEmit,
          },
        },
      ],
    }).compile();

    controller = module.get(TextTreatmentController);
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
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

    const res = await controller.analyzeInvoice({
      invoice_id: 3,
      content: 'texte pour intégration',
    });
    expect(res).toEqual({
      invoice_id: '3',
      result: { content: 'INT OK', amount: 42 },
    });
  });

  it('retourne le fallback via le controller (échec OpenAI)', async () => {
    mockCreate.mockRejectedValueOnce(new Error('fail'));
    const res = await controller.analyzeInvoice({
      invoice_id: 3,
      content: 'test erreur',
    });
    expect(res).toEqual({
      invoice_id: '3',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});
