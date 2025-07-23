
"use client";

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import { generateStory } from '@/ai/flows/generate-story';
import { translateToEnglish } from '@/ai/flows/translate-to-english';
import { generateImageFromStory, GenerateImageFromStoryInput } from '@/ai/flows/generate-image-from-story';
import { splitStory, SplitStoryOutput } from '@/ai/flows/split-story';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface StoryPart {
  part: 'Beginning' | 'Middle' | 'End';
  text: string;
  image: string;
}

export default function SahayakAI() {
  const [prompt, setPrompt] = useState('');
  const [generatedStory, setGeneratedStory] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
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
        setGeneratedStory('');
        setStoryParts([]);
        setEnglishTranslation('');
        
        const storyResult = await generateStory({ prompt });
        if (storyResult && storyResult.story) {
          setGeneratedStory(storyResult.story);
          setActiveTab('story');

          const splitStoryResult = await splitStory({ story: storyResult.story });

          if (splitStoryResult) {
            const parts: SplitStoryOutput = splitStoryResult;
            const imagePrompts: GenerateImageFromStoryInput[] = [
              { story: parts.beginning, part: 'Beginning' },
              { story: parts.middle, part: 'Middle' },
              { story: parts.end, part: 'End' }
            ];

            const imagePromises = imagePrompts.map(prompt => generateImageFromStory(prompt));
            const imageResults = await Promise.all(imagePromises);

            const newStoryParts: StoryPart[] = imageResults.map((result, index) => ({
              part: imagePrompts[index].part as 'Beginning' | 'Middle' | 'End',
              text: (parts as any)[imagePrompts[index].part.toLowerCase()],
              image: result.image
            }));
            
            setStoryParts(newStoryParts);
          } else {
            toast({ title: "Story Splitting Failed", description: "Could not split the story.", variant: "destructive" });
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
    const textToTranslate = generatedStory || prompt;
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
    if (storyParts.length === 0) {
      toast({ title: "Error", description: "No story to download.", variant: "destructive" });
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;
      
      pdf.setFont('Helvetica');

      for (let i = 0; i < storyParts.length; i++) {
        const part = storyParts[i];

        if (i > 0) {
           pdf.addPage();
           yPos = margin;
        }

        // Add Image
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'Anonymous';
          
          const imgPromise = new Promise<{width: number, height: number}>((resolve, reject) => {
             img.onload = () => resolve({width: img.naturalWidth, height: img.naturalHeight});
             img.onerror = reject;
             img.src = part.image;
          });
          
          const {width: imgWidth, height: imgHeight} = await imgPromise;

          const aspectRatio = imgWidth / imgHeight;
          const imgDisplayHeight = contentWidth / aspectRatio;

          if (yPos + imgDisplayHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          
          pdf.addImage(img, 'PNG', margin, yPos, contentWidth, imgDisplayHeight);
          yPos += imgDisplayHeight + 5;
        } catch(e) {
            console.error("Error adding image to PDF", e);
        }

        // Add Part Title
        pdf.setFontSize(16);
        pdf.text(part.part, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // Add Story Text
        pdf.setFontSize(12);
        const textLines = pdf.splitTextToSize(part.text, contentWidth);
        
        for (const line of textLines) {
           if (yPos > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
           }
           pdf.text(line, margin, yPos);
           yPos += 7;
        }
      }
      
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
            <CardDescription>Enter a story idea to generate a story with illustrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="story-prompt">Story Idea</Label>
              <Textarea
                id="story-prompt"
                placeholder="e.g., 'a farmer in a small village finding a new way to water his crops.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-4">
            <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
              Generate Story & Images
            </Button>
            <Button onClick={handleTranslate} disabled={isLoading || (!prompt && !generatedStory)} variant="secondary">
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Translate to English
            </Button>
          </CardFooter>
        </Card>
        
        {isGenerating && <OutputSkeleton />}

        {!isGenerating && (generatedStory || englishTranslation) && (
          <Card className="shadow-lg animate-in fade-in duration-500 border-2 border-accent/20">
            <CardHeader className="flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Generated Content</CardTitle>
                <CardDescription>View your generated story, images, and translation below.</CardDescription>
              </div>
              {generatedStory && (
                 <Button onClick={handleDownloadPdf}>
                    <FileDown className="mr-2 h-4 w-4" /> Download Story as PDF
                 </Button>
              )}
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="story" disabled={!generatedStory}>Story</TabsTrigger>
                  <TabsTrigger value="translation" disabled={!englishTranslation}>Translation</TabsTrigger>
                </TabsList>
                <TabsContent value="story">
                  <div ref={storyContentRef} className="mt-4 p-6 rounded-lg bg-background">
                    {storyParts.length > 0 ? (
                      <div className="space-y-8">
                        {storyParts.map((part, index) => (
                          <div key={index}>
                            <Image 
                              src={part.image} 
                              alt={`Illustration for the ${part.part.toLowerCase()} of the story`} 
                              width={800} 
                              height={450} 
                              className="w-full object-cover rounded-lg mb-4"
                              data-ai-hint={`story ${part.part.toLowerCase()}`} />
                            <h3 className="font-headline text-xl mb-2">{part.part}</h3>
                            <p className="text-lg leading-relaxed whitespace-pre-wrap">{part.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                         <p className="text-lg leading-relaxed whitespace-pre-wrap">{generatedStory}</p>
                      </ScrollArea>
                    )}
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
