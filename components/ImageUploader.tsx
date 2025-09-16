
import React, { useCallback, useState } from 'react';
import type { UploadedImage } from '../types';
import { UploadIcon, SparklesIcon, Spinner } from './icons';
import { generateImageFromText } from '../services/geminiService';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage | null) => void;
  baseImage: UploadedImage | null;
}

const fileToBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });

const fileToDataUrl = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, baseImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const [base64, dataUrl] = await Promise.all([fileToBase64(file), fileToDataUrl(file)]);
        onImageUpload({ file, base64, dataUrl });
      } catch (error) {
        console.error("Error processing file:", error);
        alert("There was an error processing your image. Please try again.");
      }
    }
  }, [onImageUpload]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

    const handleGenerateBaseImage = async () => {
      if (!generatePrompt.trim()) return;
      setIsGenerating(true);
      setError(null);
      try {
          const { base64, mimeType } = await generateImageFromText(generatePrompt);
          const blob = base64ToBlob(base64, mimeType);
          const file = new File([blob], "generated-image.png", { type: mimeType });
          const dataUrl = `data:${mimeType};base64,${base64}`;
          onImageUpload({ file, base64, dataUrl });
      } catch (e) {
          setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
          setIsGenerating(false);
      }
  };

  const tabStyle = "px-4 py-2 text-sm font-medium transition-colors";
  const activeTabStyle = "border-brand-secondary text-text-primary border-b-2";
  const inactiveTabStyle = "text-text-secondary hover:text-text-primary border-transparent border-b-2";

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-text-secondary mb-2">Base Illustration</label>
      
      {baseImage ? (
        <div className="relative w-full h-64 rounded-lg border-2 border-dashed border-base-300 p-2">
            <img src={baseImage.dataUrl} alt="Preview" className="object-contain h-full w-full rounded-lg" />
            <button
              onClick={() => onImageUpload(null)}
              className="absolute top-2 right-2 bg-base-100/70 hover:bg-base-100 text-text-primary px-3 py-1 rounded-md text-sm transition-colors"
            >
              Change
            </button>
        </div>
      ) : (
        <div>
          <div className="border-b border-base-300">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button onClick={() => setMode('upload')} className={`${tabStyle} ${mode === 'upload' ? activeTabStyle : inactiveTabStyle}`}>
                Upload
              </button>
              <button onClick={() => setMode('generate')} className={`${tabStyle} ${mode === 'generate' ? activeTabStyle : inactiveTabStyle}`}>
                Generate with AI
              </button>
            </nav>
          </div>
          
          <div className="mt-4">
            {mode === 'upload' && (
              <div
                onDragEnter={onDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative flex justify-center items-center w-full h-64 rounded-lg border-2 border-dashed transition-colors duration-200 ${isDragging ? 'border-brand-secondary bg-base-300/50' : 'border-base-300'}`}
              >
                  <div className="text-center p-4">
                    <UploadIcon />
                     <label htmlFor="file-upload" className="relative cursor-pointer">
                        <p className="mt-2 text-sm text-gray-500">
                            <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
                        </p>
                    </label>
                    <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
                  </div>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />
              </div>
            )}
            {mode === 'generate' && (
              <div className="space-y-3">
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., A cute robot holding a red skateboard in a watercolor style"
                  className="block w-full bg-base-300 border-base-300 text-text-primary text-sm rounded-lg focus:ring-brand-secondary focus:border-brand-secondary p-2.5 transition-colors h-28"
                  disabled={isGenerating}
                  aria-label="Prompt to generate base image"
                />
                <button
                  onClick={handleGenerateBaseImage}
                  disabled={isGenerating || !generatePrompt.trim()}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-secondary disabled:bg-base-300 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Spinner /> : <SparklesIcon />}
                  <span className="ml-2">{isGenerating ? 'Generating...' : 'Generate Image'}</span>
                </button>
                {error && <p className="text-red-400 text-sm mt-2 text-center" role="alert">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
