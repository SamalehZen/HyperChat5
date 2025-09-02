'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { 
  ArrowUp, 
  Bot, 
  Brain, 
  Cpu, 
  Sparkles, 
  Zap,
  Paperclip,
  Globe,
  ChevronDown
} from 'lucide-react';
import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { LucideProps } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Textarea } from './textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

// Type definitions
export interface AIModel {
  id: string;
  name: string;
  icon: React.ComponentType<LucideProps>;
  color: string;
  description?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64?: string;
  file?: File;
}

export interface AIPromptProps {
  onSubmit?: (prompt: string, model?: string, files?: FileAttachment[]) => void;
  onModelChange?: (model: string) => void;
  onFileUpload?: (files: FileAttachment[]) => void;
  onWebSearchToggle?: (enabled: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  isGenerating?: boolean;
  selectedModel?: string;
  fileAttachments?: FileAttachment[];
  webSearchEnabled?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
  models?: AIModel[];
}

// Utility function for debouncing
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Default AI models configuration
const defaultModels: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    icon: Sparkles,
    color: 'text-blue-500',
    description: 'Fast and efficient AI model'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    icon: Bot,
    color: 'text-green-500',
    description: 'Compact OpenAI model'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    icon: Brain,
    color: 'text-purple-500',
    description: 'Advanced reasoning capabilities'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    icon: Zap,
    color: 'text-orange-500',
    description: 'High-performance model'
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    icon: Cpu,
    color: 'text-red-500',
    description: 'Open source excellence'
  }
];

// Memoized components for performance optimization
const ModelSelector = React.memo<{
  currentModel: AIModel;
  models: AIModel[];
  selectedModel: string;
  onModelChange?: (model: string) => void;
  isGenerating: boolean;
  isExpanded: boolean;
}>(({ currentModel, models, selectedModel, onModelChange, isGenerating, isExpanded }) => {
  const ModelIcon = currentModel.icon;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "shrink-0 transition-all duration-200",
            currentModel.color,
            !isExpanded && "scale-90"
          )}
          disabled={isGenerating}
        >
          <ModelIcon size={16} />
          <ChevronDown size={12} className="opacity-50 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {models.map((model) => {
          const Icon = model.icon;
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange?.(model.id)}
              className={cn(
                "flex items-center gap-3 p-3",
                selectedModel === model.id && "bg-accent"
              )}
            >
              <Icon size={16} className={model.color} />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ModelSelector.displayName = 'ModelSelector';

const FileAttachmentsDisplay = React.memo<{
  fileAttachments: FileAttachment[];
}>(({ fileAttachments }) => {
  if (fileAttachments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex gap-2 p-3 pb-0 flex-wrap"
      layoutId="file-attachments"
    >
      {fileAttachments.map((file) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-lg text-sm"
          layoutId={`file-${file.id}`}
        >
          <Paperclip size={14} />
          <span className="max-w-32 truncate">{file.name}</span>
        </motion.div>
      ))}
    </motion.div>
  );
});

FileAttachmentsDisplay.displayName = 'FileAttachmentsDisplay';

const SuggestionsDisplay = React.memo<{
  suggestions: string[];
  isGenerating: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}>(({ suggestions, isGenerating, onSuggestionClick }) => {
  if (suggestions.length === 0 || isGenerating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 space-y-2"
      layoutId="suggestions-container"
    >
      <p className="text-sm text-muted-foreground px-1">Suggestions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSuggestionClick?.(suggestion)}
            className={cn(
              "px-3 py-2 text-sm bg-secondary hover:bg-secondary/80",
              "rounded-lg transition-all duration-200 text-left",
              "hover:shadow-md border border-transparent hover:border-border"
            )}
            layoutId={`suggestion-${index}`}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});

SuggestionsDisplay.displayName = 'SuggestionsDisplay';

export const AI_Prompt = React.forwardRef<HTMLTextAreaElement, AIPromptProps>(
  ({
    onSubmit,
    onModelChange,
    onFileUpload,
    onWebSearchToggle,
    placeholder = "Demandez n'importe quoi...",
    disabled = false,
    isGenerating = false,
    selectedModel = 'gemini-2.5-flash',
    fileAttachments = [],
    webSearchEnabled = false,
    suggestions = [],
    onSuggestionClick,
    className,
    models = defaultModels,
    ...props
  }, ref) => {
    // State management
    const [prompt, setPrompt] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Memoized current model to prevent re-computation
    const currentModel = useMemo(() => {
      for (let i = 0; i < models.length; i++) {
        if (models[i].id === selectedModel) {
          return models[i];
        }
      }
      return models[0];
    }, [models, selectedModel]);

    // Debounced textarea height adjustment for better performance
    const debouncedAdjustHeight = useMemo(
      () => debounce(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
      }, 50),
      []
    );

    // Use deferred value for prompt to reduce re-renders during fast typing
    const deferredPrompt = useDeferredValue(prompt);

    useEffect(() => {
      debouncedAdjustHeight();
    }, [deferredPrompt, debouncedAdjustHeight]);

    // Handle form submission
    const handleSubmit = useCallback((e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (!prompt.trim() || disabled || isGenerating) return;
      
      onSubmit?.(prompt, selectedModel, fileAttachments);
      setPrompt('');
      setIsExpanded(false);
      
      // Reset textarea height
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 100);
    }, [prompt, selectedModel, fileAttachments, disabled, isGenerating, onSubmit]);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files || [];
      const files: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i]);
      }
      
      const newAttachments: FileAttachment[] = files.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file
      }));

      onFileUpload?.(newAttachments);
    }, [onFileUpload]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }, [handleSubmit]);

    // Debounced input change to reduce re-renders
    const debouncedSetExpanded = useMemo(
      () => debounce((value: string) => {
        setIsExpanded(value.length > 0 || isFocused);
      }, 100),
      [isFocused]
    );

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setPrompt(value);
      debouncedSetExpanded(value);
    }, [debouncedSetExpanded]);

    // Handle focus states
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setIsExpanded(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      setIsExpanded(prompt.length > 0);
    }, [prompt.length]);

    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <form onSubmit={handleSubmit} className="relative">
          <motion.div
            layout
            layoutId="ai-input-container"
            className={cn(
              "relative bg-background border rounded-2xl shadow-lg transition-all duration-200",
              isFocused 
                ? "border-primary shadow-xl ring-2 ring-primary/10" 
                : "border-border shadow-md",
              isGenerating && "opacity-75"
            )}
            style={{ willChange: 'transform' }}
          >
            {/* Optimized File Attachments Display */}
            <AnimatePresence>
              <FileAttachmentsDisplay fileAttachments={fileAttachments} />
            </AnimatePresence>

            {/* Main Input Container */}
            <div className="flex items-end p-3 gap-3">
              {/* Optimized AI Model Selector */}
              <div className="flex items-center gap-2">
                <ModelSelector
                  currentModel={currentModel}
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  isGenerating={isGenerating}
                  isExpanded={isExpanded}
                />
              </div>

              {/* Text Input */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  disabled={disabled || isGenerating}
                  className={cn(
                    "min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-0 focus:ring-0 transition-all duration-200",
                    "placeholder:text-muted-foreground/60"
                  )}
                  rows={1}
                  {...props}
                />
                
                {/* Animated placeholder enhancement */}
                {!prompt && !isFocused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center pointer-events-none"
                  >
                    <span className="text-muted-foreground/40 text-sm">
                      {placeholder}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1"
                    >
                      {/* Web Search Toggle */}
                      <Button
                        type="button"
                        variant={webSearchEnabled ? "default" : "ghost"}
                        size="icon-sm"
                        onClick={() => onWebSearchToggle?.(!webSearchEnabled)}
                        disabled={isGenerating}
                        className="shrink-0"
                      >
                        <Globe size={14} />
                      </Button>

                      {/* File Upload */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isGenerating}
                        className="shrink-0"
                      >
                        <Paperclip size={14} />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!prompt.trim() || disabled || isGenerating}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    prompt.trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <motion.div
                    animate={{ 
                      rotate: isGenerating ? 360 : 0,
                      scale: prompt.trim() ? 1 : 0.9
                    }}
                    transition={{ 
                      rotate: { duration: 1, repeat: isGenerating ? Infinity : 0, ease: "linear" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <ArrowUp size={14} />
                  </motion.div>
                </Button>
              </div>
            </div>

            {/* Loading State */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pb-3"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <currentModel.icon size={14} className={currentModel.color} />
                    </motion.div>
                    <span>Génération en cours...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </form>

        {/* Optimized Suggestions */}
        <AnimatePresence>
          <SuggestionsDisplay
            suggestions={suggestions}
            isGenerating={isGenerating}
            onSuggestionClick={onSuggestionClick}
          />
        </AnimatePresence>
      </div>
    );
  }
);

AI_Prompt.displayName = 'AI_Prompt';

export default AI_Prompt;