import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class TextTreatmentService {
  private openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  async analyze(
    invoiceId: string,
    content: string,
  ): Promise<{
    invoice_id: string;
    result: { content: string; amount: number };
  }> {
    const prompt = `Tu es une IA spécialisée dans l’analyse de texte de facture.
        Tu dois retourner un JSON avec deux champs :
        {
          "content": "un résumé ou traitement structuré de la facture",
          "amount": montant_total_en_euros_float
        }
        Texte à analyser : ${content}`.trim();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'mistralai/devstral-small:free',
        messages: [
          {
            role: 'system',
            content:
              'Tu es une IA qui extrait les données importantes d’une facture.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'invoice_analyze',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                amount: { type: 'number' },
              },
              required: ['content', 'amount'],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = completion.choices[0].message.content;
      const parsed = JSON.parse(raw);

      return {
        invoice_id: invoiceId,
        result: parsed,
      };
    } catch {
      return {
        invoice_id: invoiceId,
        result: {
          content:
            'Le texte fourni ne contient pas de détails pour générer un résumé structuré de la facture.',
          amount: 0,
        },
      };
    }
  }
}
