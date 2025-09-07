
'use server';

/**
 * @fileOverview A story generation AI agent.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('The prompt for the story.'),
  language: z.string().describe('The language for the story to be generated in.'),
  grade: z.string().describe('The grade level of the student the story is for.'),
  characterImage: z
    .string()
    .optional()
    .describe(
      "A reference image of the main character as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe('The generated story.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(
  input: GenerateStoryInput
): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const promptParts: any[] = [];
    let systemPrompt = `You are a master storyteller. Generate a culturally relevant, descriptive, detailed, and elaborate story in ${input.language} based on the following prompt. The story should be substantial in length, with well-developed characters and a clear plot. The story should be tailored for a student in ${input.grade}. Adjust the complexity, vocabulary, and themes accordingly.`;
    
    if (input.characterImage) {
      promptParts.push({media: {url: input.characterImage}});
      systemPrompt += `\n\nVERY IMPORTANT: The main character of the story MUST be based on the person in the provided image. Analyze the image and weave the character into the narrative you create based on the prompt.`
    }

    promptParts.push({text: `Prompt: ${input.prompt}`})

    const {output} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: promptParts,
      system: systemPrompt,
      output: {
        schema: GenerateStoryOutputSchema,
      },
      config: {
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

    return output!;
  }
);
