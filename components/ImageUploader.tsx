import React, { useCallback, useState } from 'react';
import type { UploadedImage } from '../types';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
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

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, baseImage }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="block text-sm font-medium text-text-secondary mb-2">Base Illustration</label>
      <div
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex justify-center items-center w-full h-64 rounded-lg border-2 border-dashed transition-colors duration-200 ${isDragging ? 'border-brand-secondary bg-base-200' : 'border-base-300'}`}
      >
        {baseImage ? (
          <>
            <img src={baseImage.dataUrl} alt="Preview" className="object-contain h-full w-full rounded-lg p-2" />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="absolute bottom-2 right-2 bg-base-100/70 hover:bg-base-100 text-text-primary px-3 py-1 rounded-md text-sm transition-colors"
            >
              Change
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-500">
                <span className="font-semibold text-brand-secondary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
        />
      </div>
    </div>
  );
};
