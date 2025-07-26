
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

const ReactFlowNodeSchema = z.object({
    id: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({ label: z.string() }),
    style: z.object({
        width: z.number().optional(),
    }).optional(),
});

const ReactFlowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    animated: z.boolean().optional(),
    type: z.string().optional(),
});

const ReactFlowDiagramSchema = z.object({
    nodes: z.array(ReactFlowNodeSchema),
    edges: z.array(ReactFlowEdgeSchema),
});


const GenerateTeachingKitOutputSchema = z.object({
  lessonPlanner: z
    .array(LessonPlannerSchema)
    .describe(
      'A structured lesson plan with activities, objectives, timings, and materials.'
    ),
  mindmapTitle: z.string().describe('A concise title for the mindmap, based on the topic.'),
  mindmap: ReactFlowDiagramSchema.describe('A mindmap of the topic in React Flow format. It must cover the key concepts, figures, and themes of the topic.'),
  roadmap: ReactFlowDiagramSchema.describe('A sequential roadmap flowchart of the lesson in React Flow format. Steps: Introduction -> Core Concepts -> Activity Time -> Reflection -> Assessment.'),
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

Generate the following components in a structured JSON format for React Flow:

1.  **Lesson Planner**: Create a table-like structure with columns for 'Activity', 'Objective', 'Time (in minutes)', and 'Materials'.
2.  **Mindmap**: Generate a comprehensive and detailed mindmap diagram as a React Flow data structure.
    -   The mindmap must be rich with content. Start with a central root node for the main topic.
    -   Branch out from the root to at least 4-5 major concepts or themes.
    -   Each major concept must then branch out into at least 3-4 detailed sub-points, examples, or related facts.
    -   The total number of nodes should be at least 15-20 to ensure the diagram is thorough.
    -   Nodes should have an 'id', 'position' {x, y}, and 'data' {label}. The root node should be at {x: 0, y: 0}. Arrange other nodes radially around the center, ensuring there is no overlap.
    -   Edges should have an 'id', 'source', and 'target'. Use 'smoothstep' type.
    -   Also generate a short, descriptive title for the mindmap based on the topic.
3.  **Roadmap**: Generate a detailed sequential flowchart for the lesson as a React Flow data structure.
    -   It must visualize a detailed lesson flow with at least 6-8 steps. For example: Introduction -> Hook Activity -> Core Concept 1 -> Core Concept 2 -> Group Activity -> Individual Work -> Reflection -> Assessment.
    -   Arrange nodes horizontally with increasing x positions (e.g., 0, 250, 500, ...) and a constant y position.
    -   Edges should be animated and of type 'smoothstep'.
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
