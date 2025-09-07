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
  story: z
    .string()
    .describe('The part of the story to generate an image from.'),
  part: z
    .string()
    .describe('The part of the story this is (e.g., Beginning, Middle, End).'),
});
export type GenerateImageFromStoryInput = z.infer<
  typeof GenerateImageFromStoryInputSchema
>;

const GenerateImageFromStoryOutputSchema = z.object({
  image: z
    .string()
    .describe(
      "The generated image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
    const imagePrompt = `Your primary instruction is to create an image. This image MUST NOT contain any text, letters, or words. This is the most important rule.

Create a beautiful, cinematic, and culturally relevant illustration for the following part of a story:
Part: ${input.part}
Story Text: "${input.story}"

Again, do not include any text in the image. The image should be a pure visual representation.`;

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    const image = result.media!.url!;

    return {image};
  }
);
