
'use server';

/**
 * @fileOverview Generates an image based on a given story and a character reference image.
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
  characterImage: z
    .string()
    .optional()
    .describe(
      "A reference image of the main character as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
    const promptParts: any[] = [];

    if (input.characterImage) {
      promptParts.push({media: {url: input.characterImage}});
      promptParts.push({text: `VERY IMPORTANT: The user provided an image to be used as a reference for the main character. Your task is to create a brand new illustration that integrates the character from the reference photo into the story scene described below.

      - Analyze the person in the reference image. Your new illustration MUST feature this person as the main character.
      - Maintain the key facial features and likeness of the person from the reference image.
      - Adapt their clothing and appearance to fit the historical and cultural context of the story.
      - Ensure the style, lighting, and atmosphere of your generated image are consistent with a continuous narrative.
      - The generated image MUST NOT contain any text, letters, or words. This is the most important rule.

      Story Part: ${input.part}
      Story Text: "${input.story}"

      Again, do not include any text in the image. The image should be a pure visual representation that integrates the reference character into the story world.`});
    } else {
       promptParts.push({text: `Your primary instruction is to create an image. This image MUST NOT contain any text, letters, or words. This is the most important rule.

      Create a beautiful, cinematic, and culturally relevant illustration for the following part of a story:
      Part: ${input.part}
      Story Text: "${input.story}"

      Again, do not include any text in the image. The image should be a pure visual representation.`});
    }


    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: promptParts,
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
    
    if (!result.media) {
        throw new Error('Image generation failed. The model did not return an image.');
    }

    const image = result.media.url!;

    return {image};
  }
);
