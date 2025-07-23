'use server';

/**
 * @fileOverview A translation AI agent.
 *
 * - translateToEnglish - A function that translates text to English.
 * - TranslateToEnglishInput - The input type for the translateToEnglish function.
 * - TranslateToEnglishOutput - The return type for the translateToEnglish function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateToEnglishInputSchema = z.object({
  text: z.string().describe('The text to translate to English.'),
});
export type TranslateToEnglishInput = z.infer<typeof TranslateToEnglishInputSchema>;

const TranslateToEnglishOutputSchema = z.object({
  translation: z.string().describe('The translated text in English.'),
});
export type TranslateToEnglishOutput = z.infer<typeof TranslateToEnglishOutputSchema>;

export async function translateToEnglish(input: TranslateToEnglishInput): Promise<TranslateToEnglishOutput> {
  return translateToEnglishFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateToEnglishPrompt',
  input: {schema: TranslateToEnglishInputSchema},
  output: {schema: TranslateToEnglishOutputSchema},
  prompt: `Translate the following text to English:\n\n{{text}}`,
});

const translateToEnglishFlow = ai.defineFlow(
  {
    name: 'translateToEnglishFlow',
    inputSchema: TranslateToEnglishInputSchema,
    outputSchema: TranslateToEnglishOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
