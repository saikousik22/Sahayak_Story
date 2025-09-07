
"use client";

import React, { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { generateStory } from '@/ai/flows/generate-story';
import { translateToEnglish } from '@/ai/flows/translate-to-english';
import { generateImageFromStory, GenerateImageFromStoryInput } from '@/ai/flows/generate-image-from-story';
import { splitStory, SplitStoryOutput } from '@/ai/flows/split-story';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { generateTeachingKit, GenerateTeachingKitOutput } from '@/ai/flows/generate-teaching-kit';
import { ReactFlowDiagram } from '@/components/react-flow-diagram';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Languages, Loader2, BookOpen, Volume2, Image as ImageIcon, Play, GraduationCap, Brain, Route, PencilRuler, MapPin, Lightbulb, Users, Swords, ClipboardCheck, Puzzle, Gamepad2, Mic2, FileImage, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StorySlideshow } from '@/components/story-slideshow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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
        <Skeleton className="h-[338px] w-full rounded-lg" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

export interface StoryPart {
  part: 'Beginning' | 'Middle' | 'End';
  text: string;
  image: string;
  audio: string;
}

const activityIcons = {
  'Role Play': <Swords className="h-8 w-8 text-accent-foreground" />,
  'Matching Game': <Puzzle className="h-8 w-8 text-accent-foreground" />,
  'Quiz': <ClipboardCheck className="h-8 w-8 text-accent-foreground" />,
  'Group Discussion': <Users className="h-8 w-8 text-accent-foreground" />,
  'Map Pointing': <MapPin className="h-8 w-8 text-accent-foreground" />,
  'True or False': <Gamepad2 className="h-8 w-8 text-accent-foreground" />,
};

const tipIcons = {
  'Regional Connection': <MapPin className="h-8 w-8 text-accent-foreground" />,
  'Language Support': <Mic2 className="h-8 w-8 text-accent-foreground" />,
  'Low-resource Classroom': <Lightbulb className="h-8 w-8 text-accent-foreground" />,
  'Multi-grade Classroom': <Users className="h-8 w-8 text-accent-foreground" />,
};

export default function SahayakAI() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('Marathi');
  const [grade, setGrade] = useState('5th Grade');
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [splitResult, setSplitResult] = useState<SplitStoryOutput | null>(null);
  const [teachingKit, setTeachingKit] = useState<GenerateTeachingKitOutput | null>(null);
  const [activeTab, setActiveTab] = useState('story');
  const [showSlideshow, setShowSlideshow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenerating, startGenerating] = useTransition();
  const [isTranslating, startTranslating] = useTransition();
  const [isGeneratingRichContent, startGeneratingRichContent] = useTransition();
  const [isGeneratingKit, startGeneratingKit] = useTransition();

  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!prompt) {
      toast({ title: "Prompt is empty", description: "Please enter a prompt to generate a story.", variant: "destructive" });
      return;
    }
    if (!language) {
      toast({ title: "Language is empty", description: "Please enter a language.", variant: "destructive" });
      return;
    }
     if (!grade) {
      toast({ title: "Grade is empty", description: "Please enter a grade level.", variant: "destructive" });
      return;
    }

    startGenerating(async () => {
      try {
        setGeneratedStory('');
        setStoryParts([]);
        setEnglishTranslation('');
        setSplitResult(null);
        setTeachingKit(null);
        setShowSlideshow(false);
        setActiveTab('story');
        
        const storyResult = await generateStory({ prompt, language, grade, characterImage: characterImage || undefined });
        if (storyResult && storyResult.story) {
          setGeneratedStory(storyResult.story);
          
          const splitStoryResult = await splitStory({ story: storyResult.story });

          if (splitStoryResult) {
            setSplitResult(splitStoryResult);
            const initialParts = [
              { part: 'Beginning', text: splitStoryResult.beginning, image: '', audio: '' },
              { part: 'Middle', text: splitStoryResult.middle, image: '', audio: '' },
              { part: 'End', text: splitStoryResult.end, image: '', audio: '' }
            ];
            setStoryParts(initialParts as StoryPart[]);
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
  
  const handleGenerateTeachingKit = () => {
    if (!prompt) {
      toast({ title: "No topic available", description: "Please enter a topic first.", variant: "destructive" });
      return;
    }

    startGeneratingKit(async () => {
      try {
        const kitResult = await generateTeachingKit({ topic: prompt, language, grade });
        if (kitResult) {
          setTeachingKit(kitResult);
          setActiveTab('kit');
        } else {
          toast({ title: "Teaching Kit Failed", description: "Could not generate the teaching kit.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Teaching kit generation failed:", error);
        toast({ title: "An Error Occurred", description: "Failed to generate teaching kit. Please try again.", variant: "destructive" });
      }
    });
  };

  const handleGenerateRichContent = () => {
    if (!splitResult) {
      toast({ title: "No story available", description: "Please generate a story first.", variant: "destructive" });
      return;
    }

    startGeneratingRichContent(async () => {
      try {
        const parts = splitResult;
        
        const [beginningEn, middleEn, endEn] = await Promise.all([
            translateToEnglish({text: parts.beginning}),
            translateToEnglish({text: parts.middle}),
            translateToEnglish({text: parts.end})
        ]);
        
        // Generate a new image for all three parts of the story, using the character reference
        const imagePrompts: GenerateImageFromStoryInput[] = [
          { story: beginningEn.translation, part: 'Beginning', characterImage: characterImage || undefined },
          { story: middleEn.translation, part: 'Middle', characterImage: characterImage || undefined },
          { story: endEn.translation, part: 'End', characterImage: characterImage || undefined }
        ];

        const audioPrompts = [
          textToSpeech({text: parts.beginning}),
          textToSpeech({text: parts.middle}),
          textToSpeech({text: parts.end}),
        ];

        const generationPromises = [
          ...imagePrompts.map(p => generateImageFromStory(p)),
          ...audioPrompts,
        ];
        
        const results = await Promise.all(generationPromises);
        const imageResults = results.slice(0, 3);
        const audioResults = results.slice(3);

        const newStoryParts: StoryPart[] = imageResults.map((result, index) => ({
          part: imagePrompts[index].part as 'Beginning' | 'Middle' | 'End',
          text: (parts as any)[imagePrompts[index].part.toLowerCase()],
          image: (result as any).image,
          audio: (audioResults[index] as any).audio
        }));
        
        setStoryParts(newStoryParts);
      } catch (error) {
        console.error("Rich content generation failed:", error);
        toast({ title: "An Error Occurred", description: "Failed to generate images or audio. Please try again.", variant: "destructive" });
      }
    });
  }
  
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


  const isLoading = isGenerating || isTranslating || isGeneratingRichContent || isGeneratingKit;
  const hasGeneratedContent = generatedStory || englishTranslation || teachingKit;
  
  const canGenerateRichContent = splitResult && storyParts.length > 0 && !storyParts[0].image;
  const canGenerateTeachingKit = prompt && !teachingKit;
  const canPlaySlideshow = storyParts.every(p => p.image && p.audio);


  return (
    <>
    {showSlideshow && <StorySlideshow parts={storyParts} onClose={() => setShowSlideshow(false)} />}
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-foreground">SahayakAI</h1>
          <p className="mt-2 text-lg text-muted-foreground">Your AI-powered assistant for language and content creation.</p>
        </header>

        <Card className="shadow-lg border-2 border-accent/20">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create Your Content</CardTitle>
            <CardDescription>Enter a topic, upload a photo, and generate a personalized story.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="story-prompt">Topic / Story Idea</Label>
              <Textarea
                id="story-prompt"
                placeholder="e.g., 'King Ashoka' or 'a farmer finding a new way to water his crops.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="text-base"
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="character-image">Upload Main Character Image (Optional)</Label>
                <div className="flex items-center gap-4">
                    <Input
                        id="character-image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <FileImage className="mr-2 h-4 w-4" />
                        Choose Image
                    </Button>
                    {characterImage && (
                        <div className="relative">
                            <Image src={characterImage} alt="Character preview" width={64} height={64} className="rounded-md object-cover" />
                             <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => setCharacterImage(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  placeholder="e.g., 'Marathi'"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-base"
                />
              </div>
               <div>
                <Label htmlFor="grade">Grade Level</Label>
                <Input
                  id="grade"
                  placeholder="e.g., '5th Grade'"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="text-base"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-4">
            <Button onClick={handleGenerate} disabled={isLoading || !prompt || !language || !grade}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
              Generate Story
            </Button>
            <Button onClick={handleTranslate} disabled={isLoading || (!prompt && !generatedStory)} variant="secondary">
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Translate to English
            </Button>
            <Button onClick={handleGenerateTeachingKit} disabled={isGeneratingKit || !prompt}>
              {isGeneratingKit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
              Generate Teaching Kit
            </Button>
          </CardFooter>
        </Card>
        
        {isLoading && !hasGeneratedContent && <OutputSkeleton />}

        {!isGenerating && hasGeneratedContent && (
          <Card className="shadow-lg animate-in fade-in duration-500 border-2 border-accent/20">
            <CardHeader className="flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Generated Content</CardTitle>
                <CardDescription>View your generated story, images, and teaching kit below.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {canGenerateRichContent && (
                  <Button onClick={handleGenerateRichContent} disabled={isGeneratingRichContent}>
                    {isGeneratingRichContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ImageIcon className="mr-2 h-4 w-4" /><Volume2 className="mr-2 h-4 w-4" /></>}
                    Generate Narration & Illustrations
                  </Button>
                )}
                 {canPlaySlideshow && (
                  <Button onClick={() => setShowSlideshow(true)}>
                      <Play className="mr-2 h-4 w-4" />
                      Play Slideshow
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="story" disabled={!generatedStory}>Story</TabsTrigger>
                  <TabsTrigger value="translation" disabled={!englishTranslation}>Translation</TabsTrigger>
                  <TabsTrigger value="kit" disabled={!teachingKit}>Teaching Kit</TabsTrigger>
                </TabsList>
                <TabsContent value="story">
                  <div className="mt-4 p-6 rounded-lg bg-background">
                    {storyParts.length > 0 && storyParts.some(p => p.image) ? (
                      <div className="space-y-8">
                        {storyParts.map((part, index) => (
                          <div key={index}>
                            {part.image ? (
                              <Image 
                                src={part.image} 
                                alt={`Illustration for the ${part.part.toLowerCase()} of the story`} 
                                width={600} 
                                height={338} 
                                className="w-full object-cover rounded-lg mb-4"
                                data-ai-hint={`story ${part.part.toLowerCase()}`} />
                            ) : (
                              (isGeneratingRichContent) && <Skeleton className="w-full h-[338px] rounded-lg mb-4" />
                            )}
                            <div>
                              <h3 className="font-headline text-xl mb-2">{part.part}</h3>
                              <p className="text-lg leading-relaxed whitespace-pre-wrap">{part.text}</p>
                            </div>
                             {part.audio ? (
                              <div className="mt-4">
                                <audio controls src={part.audio} className="w-full">
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              (isGeneratingRichContent) && <Skeleton className="w-full h-10 mt-4 rounded-lg" />
                            )}
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
                 <TabsContent value="kit">
                   <div className="mt-4 p-2 sm:p-6">
                    {isGeneratingKit && <OutputSkeleton />}
                    {teachingKit ? (
                      <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
                        <AccordionItem value="item-1" className="border rounded-lg">
                           <AccordionTrigger className="p-4 font-headline text-xl">
                            <div className="flex items-center gap-2">
                              <PencilRuler /> Lesson Planner
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Activity</TableHead>
                                  <TableHead>Objective</TableHead>
                                  <TableHead>Time (Mins)</TableHead>
                                  <TableHead>Materials</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {teachingKit.lessonPlanner.map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{item.activity}</TableCell>
                                    <TableCell>{item.objective}</TableCell>
                                    <TableCell className="text-center">{item.time}</TableCell>
                                    <TableCell>{item.materials}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-2" className="border rounded-lg">
                          <AccordionTrigger className="p-4 font-headline text-xl">
                            <div className="flex items-center gap-2">
                              <Brain /> Mindmap & Roadmap
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4 space-y-8">
                             <div>
                               <h3 className="font-headline text-lg mb-2">{teachingKit.mindmapTitle}</h3>
                               <div className="w-full h-[400px] rounded-lg bg-muted/30 border">
                                <ReactFlowDiagram
                                    nodes={teachingKit.mindmap.nodes}
                                    edges={teachingKit.mindmap.edges}
                                />
                               </div>
                             </div>
                             <div>
                               <h3 className="font-headline text-lg mb-2">Roadmap: Lesson Flow</h3>
                               <div className="w-full h-[200px] rounded-lg bg-muted/30 border">
                                <ReactFlowDiagram
                                    nodes={teachingKit.roadmap.nodes}
                                    edges={teachingKit.roadmap.edges}
                                />
                               </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border rounded-lg">
                          <AccordionTrigger className="p-4 font-headline text-xl">
                            <div className="flex items-center gap-2">
                              <GraduationCap /> Curriculum Activities
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {teachingKit.curriculumActivities.map((activity, index) => (
                                <Card key={index} className="bg-secondary/50">
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{activity.type}</CardTitle>
                                    {activityIcons[activity.type]}
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-xs text-muted-foreground font-bold">{activity.objective}</p>
                                    <p className="text-sm mt-2">{activity.description}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="item-4" className="border rounded-lg">
                          <AccordionTrigger className="p-4 font-headline text-xl">
                            <div className="flex items-center gap-2">
                              <Lightbulb /> Context-aware Tips
                            </div>
                          </AccordionTrigger>
                           <AccordionContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {teachingKit.contextAwareTips.map((tip, index) => (
                                <Card key={index} className="bg-secondary/50">
                                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{tip.type}</CardTitle>
                                    {tipIcons[tip.type]}
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm mt-2">{tip.description}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                       <p className="text-center text-muted-foreground">Generate a teaching kit to see it here.</p>
                    )}
                   </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
    </>
  );
}
