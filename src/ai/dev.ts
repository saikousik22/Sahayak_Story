import { config } from 'dotenv';
config();

import '@/ai/flows/translate-to-english.ts';
import '@/ai/flows/generate-story.ts';
import '@/ai/flows/generate-image-from-story.ts';
import '@/ai/flows/split-story.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/generate-teaching-kit.ts';
