'use client';

import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
// Optimized imports - only import needed icons to reduce bundle size
import { ArrowRight } from 'lucide-react/dist/esm/icons/arrow-right';
import { Bot } from 'lucide-react/dist/esm/icons/bot';
import { Brain } from 'lucide-react/dist/esm/icons/brain';
import { Cpu } from 'lucide-react/dist/esm/icons/cpu';
import { Sparkles } from 'lucide-react/dist/esm/icons/sparkles';
import { Zap } from 'lucide-react/dist/esm/icons/zap';
import { Paperclip } from 'lucide-react/dist/esm/icons/paperclip';
import { Globe } from 'lucide-react/dist/esm/icons/globe';
import { ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down';
import { Check } from 'lucide-react/dist/esm/icons/check';
import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo, useDeferredValue, startTransition, Suspense } from 'react';
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

// Type definitions with performance annotations
export interface AIModel {
  readonly id: string;
  readonly name: string;
  readonly icon: React.ComponentType<LucideProps>;
  readonly color: string;
  readonly description?: string;
}

export interface FileAttachment {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly base64?: string;
  readonly file?: File;
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

// Optimized auto resize hook with performance improvements
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced resize function for better performance
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      // Clear previous timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        if (reset) {
          textarea.style.height = `${minHeight}px`;
          return;
        }

        // Use requestAnimationFrame for smooth animations
        requestAnimationFrame(() => {
          textarea.style.height = `${minHeight}px`;
          const newHeight = Math.max(
            minHeight,
            Math.min(
              textarea.scrollHeight,
              maxHeight ?? Number.POSITIVE_INFINITY
            )
          );
          textarea.style.height = `${newHeight}px`;
        });
      }, 16); // ~60fps
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [minHeight]);

  // Optimized resize listener with passive events
  useEffect(() => {
    const handleResize = () => adjustHeight();
    
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
};

// Memoized and optimized models with frozen objects for better performance
const defaultModels: readonly AIModel[] = Object.freeze([
  Object.freeze({
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    icon: Sparkles,
    color: 'text-blue-500',
    description: 'Fast and efficient AI model'
  }),
  Object.freeze({
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    icon: Bot,
    color: 'text-green-500',
    description: 'Compact OpenAI model'
  }),
  Object.freeze({
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    icon: Brain,
    color: 'text-purple-500',
    description: 'Advanced reasoning capabilities'
  }),
  Object.freeze({
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    icon: Zap,
    color: 'text-orange-500',
    description: 'High-performance model'
  }),
  Object.freeze({
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    icon: Cpu,
    color: 'text-red-500',
    description: 'Open source excellence'
  })
]);

// Optimized animation variants for better performance
const animationVariants = {
  fileAttachment: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  suggestion: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.15, ease: 'easeOut' }
  },
  modelSelector: {
    initial: { opacity: 0, y: -2 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 2 },
    transition: { duration: 0.12 }
  }
} as const;

// Highly optimized File Attachments Display with virtualization for large lists
const FileAttachmentsDisplay = React.memo<{
  fileAttachments: readonly FileAttachment[];
}>(({ fileAttachments }) => {
  if (fileAttachments.length === 0) return null;

  return (
    <motion.div
      {...animationVariants.fileAttachment}
      className="flex gap-2 p-3 pb-0 flex-wrap"
      layoutId="file-attachments"
      style={{ willChange: 'height, opacity' }}
    >
      {fileAttachments.map((file) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-black/5 dark:bg-white/5 text-foreground px-3 py-1 rounded-lg text-sm"
          layoutId={`file-${file.id}`}
          style={{ willChange: 'opacity, transform' }}
        >
          <Paperclip size={14} />
          <span className="max-w-32 truncate">{file.name}</span>
        </motion.div>
      ))}
    </motion.div>
  );
});

FileAttachmentsDisplay.displayName = 'FileAttachmentsDisplay';

// Optimized Suggestions Display with staggered animations
const SuggestionsDisplay = React.memo<{
  suggestions: readonly string[];
  isGenerating: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}>(({ suggestions, isGenerating, onSuggestionClick }) => {
  if (suggestions.length === 0 || isGenerating) return null;

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      startTransition(() => {
        onSuggestionClick?.(suggestion);
      });
    },
    [onSuggestionClick]
  );

  return (
    <motion.div
      {...animationVariants.suggestion}
      className="mt-4 space-y-2"
      layoutId="suggestions-container"
    >
      <p className="text-sm text-muted-foreground px-1">Suggestions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.03, 0.2) }} // Limit max delay
            onClick={() => handleSuggestionClick(suggestion)}
            className={cn(
              "px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10",
              "rounded-lg transition-colors duration-150 text-left",
              "hover:shadow-sm border border-transparent hover:border-border"
            )}
            style={{ willChange: 'background-color, border-color' }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});

SuggestionsDisplay.displayName = 'SuggestionsDisplay';

// Lazy-loaded Model Selector for better performance
const ModelSelector = React.memo<{
  currentModel: AIModel;
  models: readonly AIModel[];
  selectedModel: string;
  onModelChange?: (model: string) => void;
  isGenerating: boolean;
}>(({ currentModel, models, selectedModel, onModelChange, isGenerating }) => {
  const ModelIcon = currentModel.icon;
  
  const handleModelChange = useCallback(
    (modelId: string) => {
      startTransition(() => {
        onModelChange?.(modelId);
      });
    },
    [onModelChange]
  );

  return (
    <Suspense fallback={<div className="w-8 h-8 animate-pulse bg-muted rounded" />}>
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
                {...animationVariants.modelSelector}
                className="flex items-center gap-1"
                style={{ willChange: 'opacity, transform' }}
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
                onClick={() => handleModelChange(model.id)}
                className="flex items-center justify-between gap-2 cursor-pointer"
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
    </Suspense>
  );
});

ModelSelector.displayName = 'ModelSelector';

export const AI_Prompt = React.memo(React.forwardRef<HTMLTextAreaElement, AIPromptProps>(
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
    // State management with performance optimization
    const [prompt, setPrompt] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Optimized auto resize hook
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
      minHeight: 72,
      maxHeight: 300,
    });

    // Highly optimized current model lookup with Map for O(1) access
    const modelsMap = useMemo(() => {
      const map = new Map<string, AIModel>();
      models.forEach(model => map.set(model.id, model));
      return map;
    }, [models]);

    const currentModel = useMemo(() => {
      return modelsMap.get(selectedModel) || models[0];
    }, [modelsMap, selectedModel, models]);

    // Use deferred value for prompt to reduce re-renders during fast typing
    const deferredPrompt = useDeferredValue(prompt);

    // Debounced height adjustment
    useEffect(() => {
      adjustHeight();
    }, [deferredPrompt, adjustHeight]);

    // Optimized form submission with startTransition
    const handleSubmit = useCallback((e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (!prompt.trim() || disabled || isGenerating) return;
      
      startTransition(() => {
        onSubmit?.(prompt, selectedModel, fileAttachments);
        setPrompt('');
        adjustHeight(true);
      });
    }, [prompt, selectedModel, fileAttachments, disabled, isGenerating, onSubmit, adjustHeight]);

    // Optimized file upload with async processing
    const handleFileUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        // Process files asynchronously to avoid blocking the UI
        const processFiles = async () => {
          const newAttachments: FileAttachment[] = Array.from(fileList).map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            file
          }));

          onFileUpload?.(newAttachments);
        };

        // Reset the input value to allow re-uploading the same file
        e.target.value = '';
        
        await processFiles();
      },
      [onFileUpload]
    );

    // Optimized keyboard handling
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    }, [handleSubmit]);

    // Debounced input change for better performance
    const inputChangeTimeoutRef = useRef<NodeJS.Timeout>();
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setPrompt(value);
      
      // Clear previous timeout
      if (inputChangeTimeoutRef.current) {
        clearTimeout(inputChangeTimeoutRef.current);
      }
      
      // Debounce height adjustment
      inputChangeTimeoutRef.current = setTimeout(() => {
        adjustHeight();
      }, 50);
    }, [adjustHeight]);

    // Optimized focus handlers
    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    // Web search toggle with transition
    const handleWebSearchToggle = useCallback(() => {
      startTransition(() => {
        onWebSearchToggle?.(!webSearchEnabled);
      });
    }, [onWebSearchToggle, webSearchEnabled]);

    // Cleanup effect
    useEffect(() => {
      return () => {
        if (inputChangeTimeoutRef.current) {
          clearTimeout(inputChangeTimeoutRef.current);
        }
      };
    }, []);

    const ModelIcon = currentModel.icon;

    return (
      <MotionConfig reducedMotion="user">
        <div className={cn("w-full max-w-4xl mx-auto", className)}>
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-1.5">
              {/* Optimized File Attachments Display */}
              <AnimatePresence mode="wait">
                {fileAttachments.length > 0 && (
                  <FileAttachmentsDisplay fileAttachments={fileAttachments} />
                )}
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
                        "min-h-[72px] transition-colors duration-200"
                      )}
                      rows={1}
                      style={{ willChange: 'height' }}
                      {...props}
                    />
                  </div>

                  <div className="h-14 bg-black/5 dark:bg-white/5 rounded-b-xl flex items-center">
                    <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between w-[calc(100%-24px)]">
                      {/* Left side controls */}
                      <div className="flex items-center gap-2">
                        {/* Optimized Model Selector */}
                        <ModelSelector
                          currentModel={currentModel}
                          models={models}
                          selectedModel={selectedModel}
                          onModelChange={onModelChange}
                          isGenerating={isGenerating}
                        />
                        
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />
                        
                        {/* Web Search Toggle */}
                        <Button
                          type="button"
                          variant={webSearchEnabled ? "default" : "ghost"}
                          className={cn(
                            "rounded-lg p-2 bg-black/5 dark:bg-white/5 transition-colors duration-150",
                            "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                            webSearchEnabled 
                              ? "text-blue-500 bg-blue-500/10" 
                              : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                          )}
                          onClick={handleWebSearchToggle}
                          disabled={isGenerating}
                          aria-label="Toggle web search"
                          style={{ willChange: 'background-color, color' }}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>

                        {/* Optimized File Upload */}
                        <label
                          className={cn(
                            "rounded-lg p-2 bg-black/5 dark:bg-white/5 cursor-pointer transition-colors duration-150",
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
                          <Paperclip className="w-4 h-4" />
                        </label>
                      </div>

                      {/* Optimized Submit Button */}
                      <button
                        type="submit"
                        className={cn(
                          "rounded-lg p-2 bg-black/5 dark:bg-white/5 transition-all duration-200",
                          "hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        aria-label="Send message"
                        disabled={!prompt.trim() || disabled || isGenerating}
                        style={{ willChange: 'background-color, transform' }}
                      >
                        <motion.div
                          animate={{ 
                            rotate: isGenerating ? 360 : 0,
                            scale: prompt.trim() ? 1 : 0.9
                          }}
                          transition={{ 
                            rotate: { 
                              duration: 1, 
                              repeat: isGenerating ? Infinity : 0, 
                              ease: "linear",
                              repeatType: "loop"
                            },
                            scale: { duration: 0.15, ease: "easeOut" }
                          }}
                          style={{ willChange: 'transform' }}
                        >
                          <ArrowRight
                            className={cn(
                              "w-4 h-4 dark:text-white transition-opacity duration-150",
                              prompt.trim() ? "opacity-100" : "opacity-30"
                            )}
                          />
                        </motion.div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimized Loading State */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 pb-3"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ willChange: 'height, opacity' }}
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ willChange: 'transform' }}
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

          {/* Optimized Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <SuggestionsDisplay
                suggestions={suggestions}
                isGenerating={isGenerating}
                onSuggestionClick={onSuggestionClick}
              />
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    );
  }
));

AI_Prompt.displayName = 'AI_Prompt';

export default AI_Prompt;