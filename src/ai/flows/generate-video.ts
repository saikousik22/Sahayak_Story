
'use server';

/**
 * @fileOverview Generates a video from a series of images and audio files.
 *
 * - generateVideo - A function that handles the video generation process.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import fluent from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

fluent.setFfmpegPath(ffmpegInstaller.path);

const VideoPartSchema = z.object({
  image: z.string().describe("The image data URI for a video segment."),
  audio: z.string().describe("The audio data URI for a video segment."),
});

const GenerateVideoInputSchema = z.object({
  parts: z.array(VideoPartSchema),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  video: z
    .string()
    .describe(
      "The generated video as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ parts }) => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sahayak-ai-'));
    const clipPaths: string[] = [];

    try {
      // Step 1: Create individual clips
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const imagePath = path.join(tempDir, `image${i}.png`);
        const audioPath = path.join(tempDir, `audio${i}.wav`);
        const clipPath = path.join(tempDir, `clip${i}.mp4`);

        // Decode base64 and write to temp files
        await fs.writeFile(imagePath, part.image.split(';base64,').pop()!, 'base64');
        await fs.writeFile(audioPath, part.audio.split(';base64,').pop()!, 'base64');

        await new Promise<void>((resolve, reject) => {
          fluent()
            .addInput(imagePath)
            .loop()
            .addInput(audioPath)
            .outputOptions(['-shortest', '-pix_fmt yuv420p', '-vf', 'scale=1280:720'])
            .save(clipPath)
            .on('end', () => {
              clipPaths.push(clipPath);
              resolve();
            })
            .on('error', (err) => {
                console.error(`FFMPEG Error for clip ${i}:`, err.message);
                reject(new Error(`Failed to generate clip ${i}: ${err.message}`))
            });
        });
      }

      // Step 2: Merge clips
      if (clipPaths.length === 0) {
        throw new Error("No clips were generated to merge.");
      }
      
      const finalVideoPath = path.join(tempDir, 'final_video.mp4');
      const merger = fluent();
      clipPaths.forEach(clipPath => {
        merger.addInput(clipPath);
      });

      await new Promise<void>((resolve, reject) => {
        merger
          .mergeToFile(finalVideoPath, tempDir)
          .on('end', resolve)
          .on('error', (err) => {
            console.error('FFMPEG Merge Error:', err.message);
            reject(new Error(`Failed to merge video: ${err.message}`))
          });
      });

      // Step 3: Read final video and convert to data URI
      const videoBuffer = await fs.readFile(finalVideoPath);
      const videoDataUri = `data:video/mp4;base64,${videoBuffer.toString('base64')}`;

      return { video: videoDataUri };

    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
);
