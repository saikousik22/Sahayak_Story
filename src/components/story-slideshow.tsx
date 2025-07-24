"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { StoryPart } from '@/app/page';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StorySlideshowProps {
  parts: StoryPart[];
}

export function StorySlideshow({ parts }: StorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start playing when component mounts or index changes
    if (audioRef.current) {
      audioRef.current.src = parts[currentIndex].audio;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    }

    // Set up progress bar interval
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    }, 100);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

  }, [currentIndex, parts, isPlaying]);


  const handleAudioEnded = () => {
    if (currentIndex < parts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false); // End of story
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setProgress(0);
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(parts.length - 1, prev + 1));
    setProgress(0);
  };
  
  const restart = () => {
      setCurrentIndex(0);
      setProgress(0);
      setIsPlaying(true);
  }

  const currentPart = parts[currentIndex];

  return (
    <div className="relative w-full h-full bg-black flex flex-col justify-center items-center overflow-hidden">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        src={currentPart.audio}
        preload="auto"
      />
      <div className="w-full h-full relative">
        <Image
          src={currentPart.image}
          alt={`Illustration for ${currentPart.part}`}
          layout="fill"
          objectFit="contain"
          className="animate-in fade-in duration-1000"
        />
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
             <p className="text-white text-center text-lg drop-shadow-lg">{currentPart.text}</p>
         </div>
      </div>
      
       <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={goToPrevious} disabled={currentIndex === 0}>
          <ChevronLeft className="h-6 w-6 text-white" />
        </Button>

        <Button variant="ghost" size="icon" onClick={togglePlayPause}>
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="h-8 w-8 text-white" />
          )}
        </Button>
        
         <Button variant="ghost" size="icon" onClick={goToNext} disabled={currentIndex === parts.length - 1}>
          <ChevronRight className="h-6 w-6 text-white" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={restart} disabled={currentIndex === 0 && isPlaying}>
            <RotateCcw className="h-6 w-6 text-white" />
        </Button>
      </div>

       <div className="absolute top-4 left-4 right-4">
          <Progress value={progress} className="w-full h-2 bg-white/30" />
      </div>
    </div>
  );
}
