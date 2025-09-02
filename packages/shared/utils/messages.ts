import { ThreadItem } from '@repo/shared/types';
import { buildContentWithOCR, type ProcessedAttachment } from './ocr-utils';

export const buildCoreMessagesFromThreadItems = ({
    messages,
    query,
    fileAttachments,
}: {
    messages: ThreadItem[];
    query: string;
    fileAttachments?: Array<ProcessedAttachment>;
}) => {
    const coreMessages = [
        ...(messages || []).flatMap(item => [
            {
                role: 'user' as const,
                content: item.fileAttachments?.length
                    ? [
                          { type: 'text' as const, text: item.query || '' },
                          ...item.fileAttachments.map(attachment => buildContentWithOCR(attachment)),
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
                      ...fileAttachments.map(attachment => buildContentWithOCR(attachment)),
                  ]
                : query || '',
        },
    ];

    return coreMessages ?? [];
};
