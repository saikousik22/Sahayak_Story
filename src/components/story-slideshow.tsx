
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPart = parts[currentIndex];

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      if (audioElement.duration) {
        setProgress((audioElement.currentTime / audioElement.duration) * 100);
      }
    };

    const handleAudioEnded = () => {
      if (currentIndex < parts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsPlaying(false); // End of story
      }
    };

    // When the slide changes, set the new audio source
    audioElement.src = currentPart.audio;
    audioElement.load();
    setProgress(0); // Reset progress for the new slide

    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(_ => {
        // Automatic playback started!
        setIsPlaying(true);
      }).catch(error => {
        // Auto-play was prevented
        console.error("Audio play failed:", error);
        setIsPlaying(false);
      });
    }


    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleAudioEnded);
    
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleAudioEnded);
      audioElement.pause(); // Clean up by pausing audio
    };
  }, [currentIndex, currentPart, parts.length]);


  useEffect(() => {
      const audioElement = audioRef.current;
      if (!audioElement) return;

      if(isPlaying) {
          if (audioElement.ended && currentIndex === parts.length -1) {
              // do nothing, slideshow ended
          } else {
            audioElement.play().catch(e => console.error("Audio play failed on toggle:", e));
          }
      } else {
          audioElement.pause();
      }
  }, [isPlaying]);


  const togglePlayPause = () => {
    if (!audioRef.current) return;
    // If we are at the end and paused, hitting play should restart.
    if (audioRef.current.ended && currentIndex === parts.length - 1) {
      restart();
      return;
    }
    setIsPlaying(!isPlaying);
  };
  
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < parts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const restart = () => {
      setCurrentIndex(0);
      setIsPlaying(true);
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col justify-center items-center overflow-hidden">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />
      <div className="w-full h-full relative">
        <Image
          src={currentPart.image}
          alt={`Illustration for ${currentPart.part}`}
          fill
          style={{objectFit: 'contain'}}
          className="animate-in fade-in duration-1000"
        />
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
