import { useChatStore } from '@repo/common/store';
import { Button, Flex } from '@repo/ui';
import { FileText, X } from 'lucide-react';
import Image from 'next/image';
import { OCRStatusBadge } from '../ocr-status-badge';

export const FileAttachments = () => {
    const attachments = useChatStore(state => state.fileAttachments);
    const removeAttachment = useChatStore(state => state.removeFileAttachment);
    
    if (!attachments?.length) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Flex className="pl-2 pr-2 pt-2 md:pl-3 flex-wrap" gap="sm">
            {attachments.map((attachment) => (
                <div 
                    key={attachment.id} 
                    className="group relative rounded-lg border border-black/10 shadow-sm dark:border-white/10 bg-white dark:bg-gray-800"
                >
                    {attachment.type.startsWith('image/') ? (
                        <div className="relative h-[40px] w-[40px] rounded-lg overflow-hidden">
                            <Image
                                src={attachment.base64!}
                                alt={attachment.name}
                                className="h-full w-full object-cover"
                                width={40}
                                height={40}
                            />
                        </div>
                    ) : attachment.type === 'application/pdf' ? (
                        <div className="relative h-[40px] w-[120px] rounded-lg flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-2">
                            <FileText size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div className="flex flex-col items-start min-w-0">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60px]">
                                    PDF
                                </span>
                                {/* Show OCR status if available */}
                                {(attachment as any).ocrMethod && (
                                    <OCRStatusBadge
                                        method={(attachment as any).ocrMethod}
                                        confidence={(attachment as any).ocrConfidence}
                                        isProcessing={(attachment as any).isProcessing}
                                        error={(attachment as any).ocrError}
                                        className="text-xs h-4 px-1"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative h-[40px] w-[40px] rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    )}
                    
                    <Button
                        size={'icon-xs'}
                        variant="default"
                        onClick={() => removeAttachment(attachment.id)}
                        className="absolute right-[-4px] top-[-4px] z-10 h-4 w-4 flex-shrink-0"
                        title={`Remove ${attachment.name}`}
                    >
                        <X size={12} strokeWidth={2} />
                    </Button>
                    
                    {/* File info tooltip on hover */}
                    <div className="absolute bottom-[-25px] left-0 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20">
                        {attachment.name} ({formatFileSize(attachment.size)})
                    </div>
                </div>
            ))}
        </Flex>
    );
};

// Backward compatibility - keep the old component name
export const ImageAttachment = () => {
    return <FileAttachments />;
};
