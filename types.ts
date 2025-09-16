
export interface UploadedImage {
  file: File;
  base64: string;
  dataUrl: string;
}

export interface PromptItem {
  id: string;
  value: string;
}

export interface GeneratedImage {
  imageUrl: string;
  textResponse: string;
  sourcePrompt: string;
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';
