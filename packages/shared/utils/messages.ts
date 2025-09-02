import { ThreadItem } from '@repo/shared/types';

export const buildCoreMessagesFromThreadItems = ({
    messages,
    query,
    fileAttachments,
}: {
    messages: ThreadItem[];
    query: string;
    fileAttachments?: Array<{ id: string; name: string; type: string; data: string }>;
}) => {
    const coreMessages = [
        ...(messages || []).flatMap(item => [
            {
                role: 'user' as const,
                content: item.fileAttachments?.length
                    ? [
                          { type: 'text' as const, text: item.query || '' },
                          ...item.fileAttachments.map(attachment => 
                              attachment.type.startsWith('image/')
                                  ? { type: 'image' as const, image: attachment.data }
                                  : { type: 'text' as const, text: `[PDF: ${attachment.name}]\n${attachment.data}` }
                          ),
                      ]
                    : item.query || '',
            },
            {
                role: 'assistant' as const,
                content: item.answer?.text || '',
            },
        ]),
        {
            role: 'user' as const,
            content: fileAttachments?.length
                ? [
                      { type: 'text' as const, text: query || '' },
                      ...fileAttachments.map(attachment => 
                          attachment.type.startsWith('image/')
                              ? { type: 'image' as const, image: attachment.data }
                              : { type: 'text' as const, text: `[PDF: ${attachment.name}]\n${attachment.data}` }
                      ),
                  ]
                : query || '',
        },
    ];

    return coreMessages ?? [];
};
