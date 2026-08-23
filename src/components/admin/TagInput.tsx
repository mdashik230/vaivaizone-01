import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function TagInput({ tags, onChange, placeholder, label }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800 min-h-[56px] items-center border border-transparent focus-within:border-primary/50 transition-all">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg text-xs font-bold shadow-sm border border-neutral-100 dark:border-neutral-700 animate-in fade-in zoom-in-95"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="flex-grow flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full p-1"
          />
          {inputValue && (
            <button 
              type="button"
              onClick={addTag}
              className="p-2 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
