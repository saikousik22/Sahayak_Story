
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { StoryPart } from '@/app/page';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react';

interface StorySlideshowProps {
  parts: StoryPart[];
  onClose: () => void;
}

export function StorySlideshow({ parts, onClose }: StorySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPart = parts[currentIndex];

  const goToNext = () => {
    // Stop the current audio before changing the index
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % parts.length);
  };

  const goToPrevious = () => {
    // Stop the current audio before changing the index
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentIndex((prevIndex) => (prevIndex - 1 + parts.length) % parts.length);
  };
  
  const restart = () => {
    setCurrentIndex(0);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // When the index changes, the audio source also changes.
      // We need to explicitly load and play the new source.
      audio.load();
      audio.play().catch(e => console.error("Playback error:", e));
    } else {
      audio.pause();
    }
  }, [currentIndex, isPlaying]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goToNext();
      if (event.key === 'ArrowLeft') goToPrevious();
      if (event.key === ' ') setIsPlaying(p => !p); // Space bar to toggle play/pause
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center">
        
        {/* Main Image */}
        <div className="relative w-full h-full">
            <Image
                key={currentIndex}
                src={currentPart.image}
                alt={`Illustration for ${currentPart.part}`}
                fill
                className="object-contain animate-in fade-in duration-500"
                priority
            />
        </div>

        {/* Audio Player (hidden but functional) */}
        <audio
          ref={audioRef}
          src={currentPart.audio}
          onEnded={goToNext}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
          // Add autoPlay for the very first track
          autoPlay
        />
        
        {/* Controls */}
        <div className="absolute bottom-[-60px] w-full flex justify-center items-center gap-4">
          <Button onClick={goToPrevious} variant="outline" size="icon" className="bg-black/50 text-white border-white/50 hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </Button>
           <Button onClick={restart} variant="outline" size="icon" className="bg-black/50 text-white border-white/50 hover:bg-white/20">
            <RotateCcw className="h-6 w-6" />
          </Button>
          <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" size="icon" className="bg-black/50 text-white border-white/50 hover:bg-white/20 w-16 h-16">
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
          <Button onClick={goToNext} variant="outline" size="icon" className="bg-black/50 text-white border-white/50 hover:bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

         {/* Close Button */}
        <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-[-40px] right-0 text-white hover:bg-white/20">
          <X className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
