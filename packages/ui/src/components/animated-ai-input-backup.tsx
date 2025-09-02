'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { 
  ArrowRight, 
  Bot, 
  Brain, 
  Cpu, 
  Sparkles, 
  Zap,
  Paperclip,
  Globe,
  ChevronDown,
  Check
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

// Type definitions (kept from original)
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

// Auto resize textarea hook (from new component)
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// Default AI models configuration (kept from original)
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

// File Attachments Display Component
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
          className="flex items-center gap-2 bg-black/5 dark:bg-white/5 text-foreground px-3 py-1 rounded-lg text-sm"
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

// Suggestions Display Component
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
              "px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Use the new auto resize hook
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
      minHeight: 72,
      maxHeight: 300,
    });

    // Memoized current model to prevent re-computation
    const currentModel = useMemo(() => {
      for (let i = 0; i < models.length; i++) {
        if (models[i].id === selectedModel) {
          return models[i];
        }
      }
      return models[0];
    }, [models, selectedModel]);

    // Use deferred value for prompt to reduce re-renders during fast typing
    const deferredPrompt = useDeferredValue(prompt);

    useEffect(() => {
      adjustHeight();
    }, [deferredPrompt, adjustHeight]);

    // Handle form submission
    const handleSubmit = useCallback((e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (!prompt.trim() || disabled || isGenerating) return;
      
      onSubmit?.(prompt, selectedModel, fileAttachments);
      setPrompt('');
      adjustHeight(true);
    }, [prompt, selectedModel, fileAttachments, disabled, isGenerating, onSubmit, adjustHeight]);

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

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setPrompt(value);
      adjustHeight();
    }, [adjustHeight]);

    // Handle focus states
    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    const ModelIcon = currentModel.icon;

    return (
      <div className={cn("w-full max-w-4xl mx-auto", className)}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-1.5">
            {/* File Attachments Display */}
            <AnimatePresence>
              <FileAttachmentsDisplay fileAttachments={fileAttachments} />
            </AnimatePresence>

            {/* Main Input Container */}
            <div className="relative">
              <div className="relative flex flex-col">
                <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
                  <Textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled || isGenerating}
                    className={cn(
                      "w-full rounded-xl rounded-b-none px-4 py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
                      "min-h-[72px]"
                    )}
                    rows={1}
                    {...props}
                  />
                </div>

                <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
                  <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                    {/* Left side controls */}
                    <div className="flex items-center gap-2">
                      {/* Model Selector */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md dark:text-white hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
                            disabled={isGenerating}
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={selectedModel}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-1"
                              >
                                <ModelIcon size={16} className={currentModel.color} />
                                {currentModel.name}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </motion.div>
                            </AnimatePresence>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className={cn(
                            "min-w-[10rem]",
                            "border-black/10 dark:border-white/10",
                            "bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800"
                          )}
                        >
                          {models.map((model) => {
                            const Icon = model.icon;
                            return (
                              <DropdownMenuItem
                                key={model.id}
                                onClick={() => onModelChange?.(model.id)}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Icon size={16} className={model.color} />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{model.name}</span>
                                    {model.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {model.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {selectedModel === model.id && (
                                  <Check className="w-4 h-4 text-blue-500" />
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />
                      
                      {/* Web Search Toggle */}
                      <Button
                        type="button"
                        variant={webSearchEnabled ? "default" : "ghost"}
                        className={cn(
                          "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                          "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                          webSearchEnabled 
                            ? "text-blue-500 bg-blue-500/10" 
                            : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                        )}
                        onClick={() => onWebSearchToggle?.(!webSearchEnabled)}
                        disabled={isGenerating}
                        aria-label="Toggle web search"
                      >
                        <Globe className="w-4 h-4 transition-colors" />
                      </Button>

                      {/* File Upload */}
                      <label
                        className={cn(
                          "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer",
                          "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                          "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                        )}
                        aria-label="Attach file"
                      >
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <Paperclip className="w-4 h-4 transition-colors" />
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className={cn(
                        "rounded-lg p-2 bg-black/5 dark:bg-white/5",
                        "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                        "transition-all duration-200"
                      )}
                      aria-label="Send message"
                      disabled={!prompt.trim() || disabled || isGenerating}
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
                        <ArrowRight
                          className={cn(
                            "w-4 h-4 dark:text-white transition-opacity duration-200",
                            prompt.trim() ? "opacity-100" : "opacity-30"
                          )}
                        />
                      </motion.div>
                    </button>
                  </div>
                </div>
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
                      <ModelIcon size={14} className={currentModel.color} />
                    </motion.div>
                    <span>Génération en cours...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* Suggestions */}
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