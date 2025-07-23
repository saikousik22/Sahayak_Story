'use server';

/**
 * @fileOverview Generates an image based on a given story.
 *
 * - generateImageFromStory - A function that generates an image from a story.
 * - GenerateImageFromStoryInput - The input type for the generateImageFromStory function.
 * - GenerateImageFromStoryOutput - The return type for the generateImageFromStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageFromStoryInputSchema = z.object({
  story: z.string().describe('The story to generate an image from.'),
});
export type GenerateImageFromStoryInput = z.infer<
  typeof GenerateImageFromStoryInputSchema
>;

const GenerateImageFromStoryOutputSchema = z.object({
  image: z
    .string()
    .describe(
      "The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageFromStoryOutput = z.infer<
  typeof GenerateImageFromStoryOutputSchema
>;

export async function generateImageFromStory(
  input: GenerateImageFromStoryInput
): Promise<GenerateImageFromStoryOutput> {
  return generateImageFromStoryFlow(input);
}

const generateImagePrompt = ai.definePrompt({
  name: 'generateImagePrompt',
  input: {schema: GenerateImageFromStoryInputSchema},
  output: {schema: GenerateImageFromStoryOutputSchema},
  prompt: `Generate an illustration based on the following story:\n\n{{{story}}}`,
});

const generateImageFromStoryFlow = ai.defineFlow(
  {
    name: 'generateImageFromStoryFlow',
    inputSchema: GenerateImageFromStoryInputSchema,
    outputSchema: GenerateImageFromStoryOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.story,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {image: media!.url!};
  }
);
