
import React, { useState, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptManager } from './components/PromptManager';
import { SparklesIcon, Spinner } from './components/icons';
import { generateImageVariation } from './services/geminiService';
import type { UploadedImage, PromptItem, GeneratedImage, AppStatus } from './types';

const App: React.FC = () => {
    const [baseImage, setBaseImage] = useState<UploadedImage | null>(null);
    const [prompts, setPrompts] = useState<PromptItem[]>([{ id: self.crypto.randomUUID(), value: '' }]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [status, setStatus] = useState<AppStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (image: UploadedImage | null) => {
        setBaseImage(image);
        // When base image changes, reset the state
        if (image !== baseImage) {
            setGeneratedImages([]);
            setStatus('idle');
            setError(null);
        }
    };

    const handleAddPrompt = () => {
        setPrompts([...prompts, { id: self.crypto.randomUUID(), value: '' }]);
    };

    const handleRemovePrompt = (id: string) => {
        setPrompts(prompts.filter(p => p.id !== id));
    };

    const handlePromptChange = (id: string, value: string) => {
        setPrompts(prompts.map(p => (p.id === id ? { ...p, value } : p)));
    };

    const handleGenerate = async () => {
        if (!baseImage || prompts.every(p => p.value.trim() === '')) {
            setError("Please upload an image and provide at least one prompt.");
            return;
        }

        setStatus('loading');
        setError(null);
        setGeneratedImages([]);

        const validPrompts = prompts.filter(p => p.value.trim() !== '');

        const results = await Promise.allSettled(
            validPrompts.map(prompt =>
                generateImageVariation(baseImage.base64, baseImage.file.type, prompt.value)
            )
        );

        const newImages: GeneratedImage[] = [];
        let anyError = false;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                newImages.push({
                    ...result.value,
                    sourcePrompt: validPrompts[index].value,
                });
            } else {
                anyError = true;
                console.error(result.reason);
                 setError(prevError => 
                    prevError ? `${prevError}\n${result.reason}` : `${result.reason}`
                );
            }
        });
        
        setGeneratedImages(newImages);
        setStatus(anyError && newImages.length === 0 ? 'error' : 'success');
    };

    const isGenerationDisabled = useMemo(() => {
        return !baseImage || prompts.every(p => p.value.trim() === '') || status === 'loading';
    }, [baseImage, prompts, status]);


    return (
        <div className="min-h-screen bg-base-100 font-sans">
            <main className="container mx-auto px-4 py-8 md:py-12">
                <header className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                        Dynamic Illustration Generator
                    </h1>
                    <p className="mt-3 text-lg text-text-secondary max-w-2xl mx-auto">
                        Upload your artwork, describe your desired changes, and let Gemini bring your new visions to life.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto bg-base-200 p-6 md:p-8 rounded-2xl shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <ImageUploader onImageUpload={handleImageUpload} baseImage={baseImage} />
                        <PromptManager
                            prompts={prompts}
                            onAddPrompt={handleAddPrompt}
                            onRemovePrompt={handleRemovePrompt}
                            onPromptChange={handlePromptChange}
                        />
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerationDisabled}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Spinner />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon />
                                    Generate Variations
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {status === 'error' && error && (
                    <div className="max-w-4xl mx-auto mt-8 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                        <strong className="font-bold">An error occurred: </strong>
                        <span className="block sm:inline whitespace-pre-wrap">{error}</span>
                    </div>
                )}


                {(status === 'success' || (status === 'loading' && generatedImages.length > 0)) && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-center text-text-primary mb-8">Generated Variations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedImages.map((img, index) => (
                                <div key={index} className="bg-base-200 rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105 hover:shadow-brand-secondary/20">
                                    <img src={img.imageUrl} alt={`Variation for: ${img.sourcePrompt}`} className="w-full h-auto object-cover aspect-square" />
                                    <div className="p-4">
                                        <p className="text-sm text-text-secondary italic">"{img.sourcePrompt}"</p>
                                        {img.textResponse && <p className="mt-2 text-xs text-gray-400">{img.textResponse}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
