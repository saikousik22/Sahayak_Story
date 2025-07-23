"use client";

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateMarathiStory } from '@/ai/flows/generate-marathi-story';
import { translateToEnglish } from '@/ai/flows/translate-to-english';
import { generateImageFromStory } from '@/ai/flows/generate-image-from-story';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Languages, Loader2, FileDown, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const OutputSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader className="flex flex-row justify-between items-start">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-10 w-48 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

export default function SahayakAI() {
  const [prompt, setPrompt] = useState('');
  const [marathiStory, setMarathiStory] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('story');
  
  const [isGenerating, startGenerating] = useTransition();
  const [isTranslating, startTranslating] = useTransition();

  const storyContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!prompt) {
      toast({ title: "Prompt is empty", description: "Please enter a prompt to generate a story.", variant: "destructive" });
      return;
    }

    startGenerating(async () => {
      try {
        setMarathiStory('');
        setImageUrl('');
        setEnglishTranslation('');
        
        const storyResult = await generateMarathiStory({ prompt });
        if (storyResult && storyResult.story) {
          setMarathiStory(storyResult.story);
          setActiveTab('story');
          
          const imageResult = await generateImageFromStory({ story: storyResult.story });
          if (imageResult && imageResult.image) {
            setImageUrl(imageResult.image);
          } else {
             toast({ title: "Image Generation Failed", description: "Could not generate an image for the story.", variant: "destructive" });
          }
        } else {
          toast({ title: "Story Generation Failed", description: "Could not generate a story from your prompt.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Generation failed:", error);
        toast({ title: "An Error Occurred", description: "Failed to generate content. Please try again.", variant: "destructive" });
      }
    });
  };
  
  const handleTranslate = () => {
    const textToTranslate = marathiStory || prompt;
     if (!textToTranslate) {
      toast({ title: "Nothing to translate", description: "Please enter a prompt or generate a story first.", variant: "destructive" });
      return;
    }
    
    startTranslating(async () => {
       try {
        const translationResult = await translateToEnglish({ text: textToTranslate });
        if (translationResult && translationResult.translation) {
          setEnglishTranslation(translationResult.translation);
          setActiveTab('translation');
        } else {
          toast({ title: "Translation Failed", description: "Could not translate the text.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Translation failed:", error);
        toast({ title: "An Error Occurred", description: "Failed to translate content. Please try again.", variant: "destructive" });
      }
    });
  }

  const handleDownloadPdf = async () => {
    const element = storyContentRef.current;
    if (!element) {
      toast({ title: "Error", description: "Cannot find content to download.", variant: "destructive" });
      return;
    }

    try {
      const canvas = await html2canvas(element, { 
        backgroundColor: null,
        scale: 2,
        useCORS: true 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 15;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('sahayak-ai-story.pdf');
    } catch (error) {
       console.error("PDF download failed:", error);
       toast({ title: "PDF Download Failed", description: "Could not create PDF. Please try again.", variant: "destructive" });
    }
  };
  
  const isLoading = isGenerating || isTranslating;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-foreground">SahayakAI</h1>
          <p className="mt-2 text-lg text-muted-foreground">Your AI-powered assistant for language and content creation.</p>
        </header>

        <Card className="shadow-lg border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create Your Content</CardTitle>
            <CardDescription>Enter a prompt in any language to generate a story with an illustration, or to translate text to English.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., 'Write a short story about a farmer in a small village in Maharashtra finding a new way to water his crops.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="text-base"
            />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-4">
            <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
              Generate Story & Image
            </Button>
            <Button onClick={handleTranslate} disabled={isLoading || (!prompt && !marathiStory)} variant="secondary">
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Translate to English
            </Button>
          </CardFooter>
        </Card>
        
        {isGenerating && <OutputSkeleton />}

        {!isGenerating && (marathiStory || englishTranslation) && (
          <Card className="shadow-lg animate-in fade-in duration-500 border-2 border-accent/20">
            <CardHeader className="flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Generated Content</CardTitle>
                <CardDescription>View your generated story, image, and translation below.</CardDescription>
              </div>
              {marathiStory && (
                 <Button onClick={handleDownloadPdf}>
                    <FileDown className="mr-2 h-4 w-4" /> Download Story as PDF
                 </Button>
              )}
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="story" disabled={!marathiStory}>Story</TabsTrigger>
                  <TabsTrigger value="translation" disabled={!englishTranslation}>Translation</TabsTrigger>
                </TabsList>
                <TabsContent value="story">
                  <div ref={storyContentRef} className="mt-4 p-6 rounded-lg bg-background">
                    {imageUrl && (
                      <div className="mb-6 overflow-hidden rounded-lg border shadow-md">
                        <Image src={imageUrl} alt="Generated illustration for the story" width={800} height={450} className="w-full object-cover" data-ai-hint="story illustration"/>
                      </div>
                    )}
                    <h3 className="font-headline text-xl mb-4">Marathi Story</h3>
                    <ScrollArea className="h-64">
                       <p className="text-lg leading-relaxed whitespace-pre-wrap">{marathiStory}</p>
                    </ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="translation">
                  <div className="mt-4 p-6">
                    <h3 className="font-headline text-xl mb-4">English Translation</h3>
                    <ScrollArea className="h-64">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">{englishTranslation}</p>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
