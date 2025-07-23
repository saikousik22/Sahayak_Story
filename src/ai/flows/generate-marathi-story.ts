'use server';

/**
 * @fileOverview A Marathi story generation AI agent.
 *
 * - generateMarathiStory - A function that handles the story generation process.
 * - GenerateMarathiStoryInput - The input type for the generateMarathiStory function.
 * - GenerateMarathiStoryOutput - The return type for the generateMarathiStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMarathiStoryInputSchema = z.object({
  prompt: z.string().describe('The prompt for the Marathi story.'),
});
export type GenerateMarathiStoryInput = z.infer<typeof GenerateMarathiStoryInputSchema>;

const GenerateMarathiStoryOutputSchema = z.object({
  story: z.string().describe('The generated Marathi story.'),
});
export type GenerateMarathiStoryOutput = z.infer<typeof GenerateMarathiStoryOutputSchema>;

export async function generateMarathiStory(input: GenerateMarathiStoryInput): Promise<GenerateMarathiStoryOutput> {
  return generateMarathiStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMarathiStoryPrompt',
  input: {schema: GenerateMarathiStoryInputSchema},
  output: {schema: GenerateMarathiStoryOutputSchema},
  prompt: `You are a storyteller specializing in creating culturally relevant stories in Marathi.

  Generate a story in Marathi based on the following prompt:
  {{prompt}}`,
});

const generateMarathiStoryFlow = ai.defineFlow(
  {
    name: 'generateMarathiStoryFlow',
    inputSchema: GenerateMarathiStoryInputSchema,
    outputSchema: GenerateMarathiStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
