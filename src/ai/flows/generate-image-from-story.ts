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
  images: z
    .array(z.string())
    .describe(
      "The generated images as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
    const imagePrompts = [
      `An illustration for the beginning of this story: ${input.story}`,
      `An illustration for the middle of this story: ${input.story}`,
      `An illustration for the end of this story: ${input.story}`,
    ];

    const imagePromises = imagePrompts.map(prompt =>
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const imageResults = await Promise.all(imagePromises);
    const images = imageResults.map(result => result.media!.url!);

    return {images};
  }
);
