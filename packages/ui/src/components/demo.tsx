'use client';

import React, { useState } from 'react';
import { AI_Prompt, type AIModel, type FileAttachment } from './animated-ai-input';
import { Bot, Brain, Cpu, Sparkles, Zap } from 'lucide-react';

const demoModels: AIModel[] = [
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

export const AIPromptDemo = () => {
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Expliquez-moi les bases de l\'intelligence artificielle',
    'Comment fonctionne l\'apprentissage automatique?',
    'Quelles sont les applications pratiques de l\'IA?'
  ]);

  const handleSubmit = (prompt: string, model?: string, files?: FileAttachment[]) => {
    console.log('Submitted:', { prompt, model, files });
    setIsGenerating(true);
    
    // Simulate AI response
    setTimeout(() => {
      setIsGenerating(false);
      setSuggestions([
        'Pouvez-vous donner un exemple concret?',
        'Quels sont les défis actuels?',
        'Comment puis-je en apprendre davantage?'
      ]);
    }, 3000);
  };

  const handleModelChange = (model: string) => {
    console.log('Model changed:', model);
    setSelectedModel(model);
  };

  const handleFileUpload = (files: FileAttachment[]) => {
    console.log('Files uploaded:', files);
    setFileAttachments(prev => [...prev, ...files]);
  };

  const handleWebSearchToggle = (enabled: boolean) => {
    console.log('Web search toggle:', enabled);
    setWebSearchEnabled(enabled);
  };

  const handleSuggestionClick = (suggestion: string) => {
    console.log('Suggestion clicked:', suggestion);
    handleSubmit(suggestion, selectedModel, fileAttachments);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">AI Prompt Demo</h1>
          <p className="text-muted-foreground text-center">
            Test du nouveau composant AI Prompt avec animations et fonctionnalités avancées
          </p>
        </div>
        
        <div className="space-y-8">
          <AI_Prompt
            onSubmit={handleSubmit}
            onModelChange={handleModelChange}
            onFileUpload={handleFileUpload}
            onWebSearchToggle={handleWebSearchToggle}
            onSuggestionClick={handleSuggestionClick}
            placeholder="Posez votre question ici..."
            selectedModel={selectedModel}
            fileAttachments={fileAttachments}
            webSearchEnabled={webSearchEnabled}
            isGenerating={isGenerating}
            suggestions={suggestions}
            models={demoModels}
          />
        </div>

        {/* Demo Controls */}
        <div className="mt-8 p-4 bg-secondary rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Demo Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Model sélectionné:</strong> {selectedModel}
            </div>
            <div>
              <strong>Fichiers joints:</strong> {fileAttachments.length}
            </div>
            <div>
              <strong>Recherche web:</strong> {webSearchEnabled ? 'Activée' : 'Désactivée'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};