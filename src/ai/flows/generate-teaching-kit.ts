
'use server';

/**
 * @fileOverview A teaching kit generation AI agent.
 *
 * - generateTeachingKit - A function that handles the teaching kit generation process.
 * - GenerateTeachingKitInput - The input type for the generateTeachingKit function.
 * - GenerateTeachingKitOutput - The return type for the generateTeachingKit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTeachingKitInputSchema = z.object({
  topic: z.string().describe('The topic to generate a teaching kit for.'),
  language: z.string().describe('The language for the teaching materials.'),
  grade: z.string().describe('The grade level of the students.'),
});
export type GenerateTeachingKitInput = z.infer<
  typeof GenerateTeachingKitInputSchema
>;

const LessonPlannerSchema = z.object({
  activity: z.string().describe('The name of the lesson activity.'),
  objective: z.string().describe('The learning objective of the activity.'),
  time: z
    .number()
    .describe('The estimated time in minutes for the activity.'),
  materials: z.string().describe('The materials required for the activity.'),
});

const CurriculumActivitySchema = z.object({
  type: z.enum([
    'Role Play',
    'Matching Game',
    'Quiz',
    'Group Discussion',
    'Map Pointing',
    'True or False',
  ]),
  description: z.string().describe('A brief description of the activity.'),
  objective: z.string().describe('The learning objective of the activity.'),
});

const ContextAwareTipSchema = z.object({
  type: z.enum([
    'Regional Connection',
    'Language Support',
    'Low-resource Classroom',
    'Multi-grade Classroom',
  ]),
  description: z
    .string()
    .describe('A brief description of the teaching tip.'),
});

const GenerateTeachingKitOutputSchema = z.object({
  lessonPlanner: z
    .array(LessonPlannerSchema)
    .describe(
      'A structured lesson plan with activities, objectives, timings, and materials.'
    ),
  mindmapTitle: z.string().describe('A concise title for the mindmap, based on the topic.'),
  mindmap: z
    .string()
    .describe(
      'A mindmap of the topic in Mermaid.js graph TD syntax. It must cover the key concepts, figures, and themes of the topic.'
    ),
  roadmap: z
    .string()
    .describe(
      'A sequential roadmap flowchart of the lesson in Mermaid.js graph TD syntax with icons. Steps: Introduction -> Core Concepts -> Activity Time -> Reflection -> Assessment.'
    ),
  curriculumActivities: z
    .array(CurriculumActivitySchema)
    .describe('A list of curriculum-based activities.'),
  contextAwareTips: z
    .array(ContextAwareTipSchema)
    .describe('A list of context-aware teaching tips.'),
});

export type GenerateTeachingKitOutput = z.infer<
  typeof GenerateTeachingKitOutputSchema
>;

export async function generateTeachingKit(
  input: GenerateTeachingKitInput
): Promise<GenerateTeachingKitOutput> {
  return generateTeachingKitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTeachingKitPrompt',
  input: {schema: GenerateTeachingKitInputSchema},
  output: {schema: GenerateTeachingKitOutputSchema},
  prompt: `You are an expert curriculum designer for K-12 education. Your task is to generate a complete, visual-only teaching kit for a {{grade}} class in {{language}} based on the provided topic. The output must be highly structured, visual, and engaging for young learners.

Topic:
{{topic}}

Generate the following components in a structured JSON format:

1.  **Lesson Planner**: Create a table-like structure with columns for 'Activity', 'Objective', 'Time (in minutes)', and 'Materials'.
2.  **Mindmap**: Analyze the topic and generate a mindmap diagram using Mermaid.js 'graph TD' syntax. The mindmap must be visually appealing and cover the topic's key elements: main concepts, important figures or events, and key themes. Use clear, concise labels. Also generate a short, descriptive title for the mindmap based on the topic.
3.  **Roadmap**: Generate a sequential flowchart using Mermaid.js 'graph TD' syntax. It must visualize a generic but effective lesson flow: Warm-up Activity -> Core Concepts -> Group Activity -> Quiz -> Reflection & Takeaway. Use simple icons or emojis in the diagram.
4.  **Curriculum-Based Activities**: Generate a list of diverse activities relevant to the topic. For each, specify its 'type' (e.g., 'Role Play', 'Matching Game'), a brief 'description', and its 'objective'.
5.  **Context-Aware Tips**: Generate a list of practical teaching tips. For each, specify its 'type' (e.g., 'Regional Connection', 'Language Support') and a 'description'.`,
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


const generateTeachingKitFlow = ai.defineFlow(
  {
    name: 'generateTeachingKitFlow',
    inputSchema: GenerateTeachingKitInputSchema,
    outputSchema: GenerateTeachingKitOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
