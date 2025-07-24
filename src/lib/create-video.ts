import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { StoryPart } from '@/app/page';

// A function to fetch a resource and return it as an ArrayBuffer
async function fetchResource(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.arrayBuffer();
}

// A function to decode an image into a raw RGBA pixel data
async function decodeImage(
    imageUrl: string,
    width: number,
    height: number
): Promise<Uint8ClampedArray> {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    const imagePromise = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
    });
    image.src = imageUrl;
    await imagePromise;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(image, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height).data;
}


// A function to decode WAV audio into raw PCM audio data
async function decodeAudio(audioUrl: string): Promise<Float32Array> {
    const arrayBuffer = await fetchResource(audioUrl);
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
}

export async function createVideo(
    storyParts: StoryPart[],
    width = 1280,
    height = 720,
    fps = 24
): Promise<Blob> {
    
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
            codec: 'avc',
            width,
            height,
        },
        audio: {
            codec: 'aac',
            sampleRate: 44100,
            numberOfChannels: 1,
        },
        fastStart: 'in-memory',
    });

    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error(e),
    });
    videoEncoder.configure({
        codec: 'avc1.42001f', // Baseline profile
        width,
        height,
        bitrate: 2_000_000, // 2 Mbps
        framerate: fps,
    });

    const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error(e),
    });
    audioEncoder.configure({
        codec: 'mp4a.40.2', // AAC-LC
        numberOfChannels: 1,
        sampleRate: 44100,
        bitrate: 128_000, // 128 Kbps
    });
    
    for (const part of storyParts) {
        // 1. Process Image
        const pixelData = await decodeImage(part.image, width, height);
        const audioData = await decodeAudio(part.audio);
        const audioDuration = audioData.length / 44100; // in seconds
        
        const numFrames = Math.floor(audioDuration * fps);
        
        for (let i = 0; i < numFrames; i++) {
            const timestamp = (i / fps) * 1_000_000; // in microseconds
            const frame = new VideoFrame(pixelData, {
                timestamp,
                duration: (1 / fps) * 1_000_000,
                codedWidth: width,
                codedHeight: height,
                format: 'RGBA'
            });
            videoEncoder.encode(frame);
            frame.close();
        }

        // 2. Process Audio
        const audioDataForEncoder = new AudioData({
            format: 'f32-planar',
            sampleRate: 44100,
            numberOfFrames: audioData.length,
            numberOfChannels: 1,
            timestamp: 0, // This will be handled by the encoder's timing
            data: audioData
        });
        audioEncoder.encode(audioDataForEncoder);
        audioDataForEncoder.close();

    }

    await videoEncoder.flush();
    await audioEncoder.flush();
    muxer.finalize();

    const { buffer } = muxer.target;
    return new Blob([buffer], { type: 'video/mp4' });
}