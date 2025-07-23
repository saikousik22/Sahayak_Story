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
  story: z.string().describe('The part of the story to generate an image from.'),
  part: z.string().describe('The part of the story this is (e.g., Beginning, Middle, End).'),
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

const generateImageFromStoryFlow = ai.defineFlow(
  {
    name: 'generateImageFromStoryFlow',
    inputSchema: GenerateImageFromStoryInputSchema,
    outputSchema: GenerateImageFromStoryOutputSchema,
  },
  async input => {
    const imagePrompt = `Generate a vivid illustration for the ${input.part} of a story. IMPORTANT: The image must not contain any words, letters, or text of any kind. The illustration should visually represent the following scene: ${input.story}`;

    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const image = result.media!.url!;

    return {image};
  }
);
