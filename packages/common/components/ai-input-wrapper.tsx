'use client';

import { useAuth } from '@clerk/nextjs';
import { AI_Prompt, type AIModel, type FileAttachment } from '@repo/ui';
import { ChatModeConfig, ChatMode } from '@repo/shared/config';
import { ModelEnum } from '@repo/ai/models';
import { cn } from '@repo/ui';
import { 
  Bot, 
  Brain, 
  Cpu, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useDeferredValue } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';
import { useAgentStream } from '../hooks/agent-provider';
import { useFileAttachment } from '../hooks';
import { useChatStore } from '../store';

// Map AI models to the UI component format based on available ChatModes
const aiModels: AIModel[] = [
  {
    id: ChatMode.GEMINI_2_5_FLASH,
    name: 'Gemini 2.5 Flash',
    icon: Sparkles,
    color: 'text-blue-500',
    description: 'Fast and efficient AI model'
  },
  {
    id: ChatMode.GPT_4o_Mini,
    name: 'GPT-4o Mini',
    icon: Bot,
    color: 'text-green-500',
    description: 'Compact OpenAI model'
  },
  {
    id: ChatMode.CLAUDE_3_5_SONNET,
    name: 'Claude 3.5 Sonnet',
    icon: Brain,
    color: 'text-purple-500',
    description: 'Advanced reasoning capabilities'
  },
  {
    id: ChatMode.DEEPSEEK_R1,
    name: 'DeepSeek R1',
    icon: Zap,
    color: 'text-orange-500',
    description: 'High-performance model'
  },
  {
    id: ChatMode.LLAMA_4_SCOUT,
    name: 'Llama 4 Scout',
    icon: Cpu,
    color: 'text-red-500',
    description: 'Open source excellence'
  }
];

export interface AIInputWrapperProps {
  showGreeting?: boolean;
  showBottomBar?: boolean;
  isFollowUp?: boolean;
  className?: string;
}

export const AIInputWrapper = React.forwardRef<HTMLDivElement, AIInputWrapperProps>(
  ({ 
    showGreeting = true, 
    showBottomBar = true, 
    isFollowUp = false,
    className 
  }, ref) => {
    const { isSignedIn } = useAuth();
    const { push } = useRouter();
    const { threadId: currentThreadId } = useParams();
    const pathname = usePathname();
    
    // Optimized Zustand selectors - separate subscriptions to minimize re-renders
    const chatMode = useChatStore(state => state.chatMode);
    const isGenerating = useChatStore(state => state.isGenerating);
    const fileAttachments = useChatStore(state => state.fileAttachments);
    const useWebSearch = useChatStore(state => state.useWebSearch);
    const threadItems = useChatStore(state => state.threadItems);
    
    // Actions (stable references - these don't cause re-renders)
    const setChatMode = useChatStore(state => state.setChatMode);
    const clearFileAttachments = useChatStore(state => state.clearFileAttachments);
    const addFileAttachment = useChatStore(state => state.addFileAttachment);
    const setUseWebSearch = useChatStore(state => state.setUseWebSearch);
    const createThread = useChatStore(state => state.createThread);
    const getThreadItems = useChatStore(state => state.getThreadItems);
    const showSuggestions = useChatStore(state => state.showSuggestions);

    // Agent stream hook
    const { handleSubmit } = useAgentStream();
    
    // File attachment hook
    const { handleFileUpload } = useFileAttachment();

    // Convert chat mode to model ID
    const selectedModelId = useMemo(() => {
      switch (chatMode) {
        case ChatMode.GEMINI_2_5_FLASH:
          return ChatMode.GEMINI_2_5_FLASH;
        case ChatMode.GPT_4o_Mini:
          return ChatMode.GPT_4o_Mini;
        case ChatMode.CLAUDE_3_5_SONNET:
          return ChatMode.CLAUDE_3_5_SONNET;
        case ChatMode.DEEPSEEK_R1:
          return ChatMode.DEEPSEEK_R1;
        case ChatMode.LLAMA_4_SCOUT:
          return ChatMode.LLAMA_4_SCOUT;
        default:
          return ChatMode.GEMINI_2_5_FLASH;
      }
    }, [chatMode]);

    // Convert file attachments to UI format
    const uiFileAttachments: FileAttachment[] = useMemo(() => 
      fileAttachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        base64: attachment.base64,
        file: attachment.file,
      })), 
    [fileAttachments]);

    // Handle form submission
    const handlePromptSubmit = useCallback(async (
      prompt: string, 
      modelId?: string, 
      files?: FileAttachment[]
    ) => {
      if (!isSignedIn && !!ChatModeConfig[chatMode as keyof typeof ChatModeConfig]?.isAuthRequired) {
        push('/sign-in');
        return;
      }

      if (!prompt.trim()) return;

      let threadId = currentThreadId?.toString();

      if (!threadId) {
        const optimisticId = uuidv4();
        push(`/chat/${optimisticId}`);
        createThread(optimisticId, { title: prompt });
        threadId = optimisticId;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('query', prompt);

      // Add file attachments if any
      if (files && files.length > 0) {
        formData.append('attachmentCount', files.length.toString());
        files.forEach((file, index) => {
          if (file.base64) {
            formData.append(`fileAttachment_${index}`, file.base64);
            formData.append(`fileName_${index}`, file.name);
            formData.append(`fileType_${index}`, file.type);
          }
        });
      } else {
        formData.append('attachmentCount', '0');
      }

      // Get thread items for context
      const threadItems = currentThreadId 
        ? await getThreadItems(currentThreadId.toString()) 
        : [];

      // Submit to the agent
      handleSubmit({
        formData,
        newThreadId: threadId,
        messages: threadItems.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
        useWebSearch,
        showSuggestions,
      });

      // Clear file attachments after submission
      clearFileAttachments();
    }, [
      isSignedIn,
      chatMode,
      push,
      currentThreadId,
      createThread,
      getThreadItems,
      handleSubmit,
      useWebSearch,
      showSuggestions,
      clearFileAttachments,
    ]);

    // Handle model change
    const handleModelChange = useCallback((modelId: string) => {
      // Map UI model ID back to chat mode - modelId should be a ChatMode value
      const newChatMode = modelId as ChatMode;
      setChatMode(newChatMode);
    }, [setChatMode]);

    // Handle file upload
    const handleFileUploadWrapper = useCallback((files: FileAttachment[]) => {
      files.forEach(file => {
        addFileAttachment({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          base64: file.base64,
          file: file.file,
        });
      });
    }, [addFileAttachment]);

    // Handle web search toggle
    const handleWebSearchToggle = useCallback((enabled: boolean) => {
      setUseWebSearch(enabled);
    }, [setUseWebSearch]);

    const isChatPage = pathname.startsWith('/chat');

    return (
      <div 
        ref={ref}
        className={cn(
          'w-full',
          currentThreadId
            ? 'absolute bottom-0'
            : 'absolute inset-0 flex h-full w-full flex-col items-center justify-center',
          className
        )}
      >
        <div className={cn(
          'mx-auto flex w-full max-w-3xl flex-col items-start',
          !currentThreadId && 'justify-center px-8'
        )}>
          <AI_Prompt
            onSubmit={handlePromptSubmit}
            onModelChange={handleModelChange}
            onFileUpload={handleFileUploadWrapper}
            onWebSearchToggle={handleWebSearchToggle}
            placeholder={isFollowUp ? 'Demander un suivi' : 'Demandez n\'importe quoi'}
            disabled={false}
            isGenerating={isGenerating}
            selectedModel={selectedModelId}
            fileAttachments={uiFileAttachments}
            webSearchEnabled={useWebSearch}
            models={aiModels}
            className="w-full"
          />
        </div>
      </div>
    );
  }
);

AIInputWrapper.displayName = 'AIInputWrapper';