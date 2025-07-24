
"use client";

import React, { useEffect, useRef } from 'react';
import { StoryPart } from '@/app/page';

interface VideoGeneratorProps {
  parts: StoryPart[];
  onComplete: () => void;
  onError: (error: string) => void;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export function VideoGenerator({ parts, onComplete, onError }: VideoGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onError("Canvas element not found.");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onError("Could not get canvas context.");
      return;
    }

    const audioContext = new AudioContext();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    // Create a single destination node for all audio tracks to be mixed into
    const mixedAudioDestination = audioContext.createMediaStreamDestination();

    let isCancelled = false;
    
    const generateVideo = async () => {
      try {
        // 1. Set up the visual stream from the canvas
        const canvasStream = canvas.captureStream(30); // 30 fps

        // 2. Set up the combined audio stream
        const audioBuffers = await Promise.all(
          parts.map(part =>
            fetch(part.audio)
              .then(res => res.arrayBuffer())
              .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
          )
        );

        // 3. Combine streams
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...mixedAudioDestination.stream.getAudioTracks()
        ]);
        
        // 4. Set up MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm; codecs=vp9,opus'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'sahayak-ai-story.webm';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          onComplete();
        };

        // Start recording
        mediaRecorderRef.current.start();
        
        // 5. Playback and render loop
        for (let i = 0; i < parts.length; i++) {
           if (isCancelled) break;
           const part = parts[i];
           const audioBuffer = audioBuffers[i];
           
           // Draw image to canvas
           await new Promise<void>((resolve, reject) => {
               const img = new Image();
               img.crossOrigin = 'Anonymous';
               img.onload = () => {
                   ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                   ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                   resolve();
               };
               img.onerror = () => reject(new Error(`Failed to load image for part ${i + 1}`));
               img.src = part.image;
           });

           // Play audio
           await new Promise<void>(resolve => {
               const source = audioContext.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(mixedAudioDestination); // Connect to our mixed stream
               source.connect(audioContext.destination); // Also connect to speakers to hear it
               source.onended = () => resolve();
               source.start(0);
           });
        }
        
      } catch (err: any) {
        onError(err.message || "An unknown error occurred during video generation.");
      } finally {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        audioContext.close();
      }
    };

    generateVideo();

    return () => {
      isCancelled = true;
      if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
      }
      audioContext.close().catch(console.error);
    };

  }, [parts, onComplete, onError]);

  // The component renders a hidden canvas, its work is done in the useEffect hook
  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'none' }} />;
}
