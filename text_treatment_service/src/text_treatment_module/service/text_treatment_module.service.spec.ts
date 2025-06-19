import { Test, TestingModule } from '@nestjs/testing';
import { TextTreatmentService } from './text_treatment_module.service';
import OpenAI from 'openai';

jest.mock('openai');

describe('TextTreatmentService', () => {
  let service: TextTreatmentService;
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

    service = module.get(TextTreatmentService);
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('appel API et parse JSON correctement', async () => {
    // Simule une réponse valide
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ content: 'Résumé OK', amount: 123.45 }),
          },
        },
      ],
    });

    const out = await service.analyze('123', 'contenu de test');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mistralai/devstral-small:free',
        messages: expect.any(Array),
        response_format: expect.any(Object),
      }),
    );
    expect(mockEmit).toHaveBeenCalledWith('invoice_data', {
      invoice_id: 123,
      content: 'Résumé OK',
      amount: 123.45,
    });
    expect(out).toEqual({
      invoice_id: '123',
      result: { content: 'Résumé OK', amount: 123.45 },
    });
  });

  it('retourne le fallback si OpenAI jette une erreur', async () => {
    mockCreate.mockRejectedValueOnce(new Error('quelque chose a pété'));
    const out = await service.analyze('123', 'rien');
    expect(mockEmit).toHaveBeenCalledWith('invoice_data', {
      invoice_id: 123,
      content:
        'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
      amount: 0,
    });
    expect(out).toEqual({
      invoice_id: '123',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});
