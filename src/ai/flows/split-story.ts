'use server';

/**
 * @fileOverview A story splitting AI agent.
 *
 * - splitStory - A function that handles splitting a story into beginning, middle, and end.
 * - SplitStoryInput - The input type for the splitStory function.
 * - SplitStoryOutput - The return type for the splitStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SplitStoryInputSchema = z.object({
  story: z.string().describe('The story to be split.'),
});
export type SplitStoryInput = z.infer<typeof SplitStoryInputSchema>;

const SplitStoryOutputSchema = z.object({
  beginning: z.string().describe('The beginning of the story.'),
  middle: z.string().describe('The middle of the story.'),
  end: z.string().describe('The end of the story.'),
});
export type SplitStoryOutput = z.infer<typeof SplitStoryOutputSchema>;

export async function splitStory(input: SplitStoryInput): Promise<SplitStoryOutput> {
  return splitStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'splitStoryPrompt',
  input: {schema: SplitStoryInputSchema},
  output: {schema: SplitStoryOutputSchema},
  prompt: `You are a story editor. Split the following story into three parts: beginning, middle, and end.
  
  Story:
  {{story}}`,
});

const splitStoryFlow = ai.defineFlow(
  {
    name: 'splitStoryFlow',
    inputSchema: SplitStoryInputSchema,
    outputSchema: SplitStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
