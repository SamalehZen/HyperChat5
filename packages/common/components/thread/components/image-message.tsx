import { IconCornerDownRight } from '@tabler/icons-react';
import { FileText } from 'lucide-react';

export const FileMessage = ({ 
    fileAttachments 
}: { 
    fileAttachments: Array<{ id: string; name: string; type: string; data: string }> 
}) => {
    if (!fileAttachments?.length) return null;
    
    return (
        <div className="flex flex-row items-center gap-2 p-1">
            <IconCornerDownRight size={16} className="text-muted-foreground/50" />
            <div className="relative flex flex-row items-center gap-2">
                {fileAttachments.map((attachment) => (
                    <div key={attachment.id} className="relative flex items-center">
                        {attachment.type.startsWith('image/') ? (
                            <img 
                                src={attachment.data} 
                                alt={attachment.name}
                                className="relative w-12 h-12 rounded-lg object-cover" 
                                title={attachment.name}
                            />
                        ) : (
                            <div 
                                className="relative w-12 h-12 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-900/20"
                                title={attachment.name}
                            >
                                <FileText size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Backward compatibility wrapper
export const ImageMessage = ({ imageAttachment }: { imageAttachment: string }) => {
    const fileAttachments = [{
        id: 'legacy',
        name: 'image',
        type: 'image/jpeg',
        data: imageAttachment
    }];
    
    return <FileMessage fileAttachments={fileAttachments} />;
};
