import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as nock from 'nock';
import { TextTreatmentService } from './text_treatment_module.service';

describe('TextTreatmentService – Unit', () => {
  let service: TextTreatmentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      providers: [TextTreatmentService],
    }).compile();

    service = module.get(TextTreatmentService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('appelle openai.chat.completions.create et parse correctement le JSON', async () => {
    const fakeResp = {
      choices: [
        {
          message: { content: JSON.stringify({ content: 'OK', amount: 99.9 }) },
        },
      ],
    };
    jest
      .spyOn(service['openai'].chat.completions, 'create')
      .mockResolvedValueOnce(fakeResp as any);

    const result = await service.analyze('INV-1', 'le contenu');
    expect(result).toEqual({
      invoice_id: 'INV-1',
      result: { content: 'OK', amount: 99.9 },
    });
  });

  it('retourne le fallback si openai échoue', async () => {
    jest
      .spyOn(service['openai'].chat.completions, 'create')
      .mockRejectedValueOnce(new Error('Network error'));

    const fallback = await service.analyze('INV-ERR', 'aucun détail');
    expect(fallback).toEqual({
      invoice_id: 'INV-ERR',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});

describe('TextTreatmentService – Integration', () => {
  let service: TextTreatmentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
      providers: [TextTreatmentService],
    }).compile();

    service = module.get(TextTreatmentService);
  });

  afterEach(() => nock.cleanAll());

  it('répond correctement via l’API simulée', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(200, {
        choices: [
          {
            message: {
              content: JSON.stringify({ content: 'INT OK', amount: 42.42 }),
            },
          },
        ],
      });

    const out = await service.analyze('I-INT', 'contenu intégration');
    expect(out).toEqual({
      invoice_id: 'I-INT',
      result: { content: 'INT OK', amount: 42.42 },
    });
  });

  it('gère une 500 interne en renvoyant le fallback', async () => {
    nock('https://openrouter.ai')
      .post('/api/v1/chat/completions')
      .reply(500, { error: 'Server error' });

    const out = await service.analyze('ERR-INT', 'rien');
    expect(out).toEqual({
      invoice_id: 'ERR-INT',
      result: {
        content:
          'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
        amount: 0,
      },
    });
  });
});
