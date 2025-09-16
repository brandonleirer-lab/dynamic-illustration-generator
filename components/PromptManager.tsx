
import React from 'react';
import type { PromptItem } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface PromptManagerProps {
  prompts: PromptItem[];
  onAddPrompt: () => void;
  onRemovePrompt: (id: string) => void;
  onPromptChange: (id: string, value: string) => void;
}

export const PromptManager: React.FC<PromptManagerProps> = ({ prompts, onAddPrompt, onRemovePrompt, onPromptChange }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-text-secondary mb-2">Variation Prompts</label>
      <div className="space-y-3">
        {prompts.map((prompt, index) => (
          <div key={prompt.id} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={`e.g., "in a watercolor style"`}
              value={prompt.value}
              onChange={(e) => onPromptChange(prompt.id, e.target.value)}
              className="flex-grow bg-base-200 border border-base-300 text-text-primary text-sm rounded-lg focus:ring-brand-secondary focus:border-brand-secondary block w-full p-2.5 transition-colors"
            />
            <button
              onClick={() => onRemovePrompt(prompt.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-base-300/50 rounded-md transition-colors disabled:opacity-50"
              disabled={prompts.length <= 1}
              aria-label="Remove prompt"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={onAddPrompt}
        className="mt-3 flex items-center text-sm font-medium text-brand-secondary hover:text-blue-400 transition-colors"
      >
        <PlusIcon />
        <span className="ml-1">Add another prompt</span>
      </button>
    </div>
  );
};
