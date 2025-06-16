import { Test, TestingModule } from '@nestjs/testing';
import { TextTreatmentService } from './text_treatment_module.service';
import OpenAI from 'openai';

jest.mock('openai');

describe('TextTreatmentService', () => {
  let service: TextTreatmentService;
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
      providers: [TextTreatmentService],
    }).compile();

    service = module.get(TextTreatmentService);
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

    const out = await service.analyze('INV-123', 'contenu de test');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mistralai/devstral-small:free',
        messages: expect.any(Array),
        response_format: expect.any(Object),
      }),
    );
    expect(out).toEqual({
      invoice_id: 'INV-123',
      result: { content: 'Résumé OK', amount: 123.45 },
    });
  });

  it('retourne le fallback si OpenAI jette une erreur', async () => {
    mockCreate.mockRejectedValueOnce(new Error('quelque chose a pété'));
    const out = await service.analyze('INV-ERR', 'rien');
    expect(out).toEqual({
      invoice_id: 'INV-ERR',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});
