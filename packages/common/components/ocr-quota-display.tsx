import React, { useEffect, useState } from 'react';
import { Badge, Card, Flex, Text } from '@repo/ui';
import { getOCRQuotaStatus } from '@repo/shared/utils/ocr-client-utils';

interface QuotaStatus {
    percentage: number;
    status: 'green' | 'yellow' | 'red';
    message: string;
}

interface OCRQuotaDisplayProps {
    className?: string;
    compact?: boolean;
}

export const OCRQuotaDisplay: React.FC<OCRQuotaDisplayProps> = ({ 
    className, 
    compact = false 
}) => {
    const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuotaStatus = async () => {
            try {
                setLoading(true);
                const status = await getOCRQuotaStatus();
                setQuotaStatus(status);
            } catch (error) {
                console.error('Failed to load OCR quota status:', error);
            } finally {
                setLoading(false);
            }
        };

        loadQuotaStatus();
    }, []);

    if (loading) {
        return compact ? (
            <Badge variant="secondary" className={className}>
                Quota...
            </Badge>
        ) : (
            <Card className={`p-3 ${className}`}>
                <Text size="sm" color="muted">Chargement du quota...</Text>
            </Card>
        );
    }

    if (!quotaStatus) {
        return null;
    }

    const getVariant = (status: string) => {
        switch (status) {
            case 'green': return 'default';
            case 'yellow': return 'secondary';
            case 'red': return 'destructive';
            default: return 'secondary';
        }
    };

    if (compact) {
        return (
            <Badge 
                variant={getVariant(quotaStatus.status)} 
                className={className}
                title={quotaStatus.message}
            >
                OCR {Math.round(quotaStatus.percentage)}%
            </Badge>
        );
    }

    return (
        <Card className={`p-3 ${className}`}>
            <Flex direction="column" gap="2">
                <Flex align="center" justify="between">
                    <Text size="sm" weight="medium">Quota OCR Google Vision</Text>
                    <Badge variant={getVariant(quotaStatus.status)}>
                        {Math.round(quotaStatus.percentage)}%
                    </Badge>
                </Flex>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${
                            quotaStatus.status === 'green' 
                                ? 'bg-green-500' 
                                : quotaStatus.status === 'yellow'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(quotaStatus.percentage, 100)}%` }}
                    />
                </div>
                
                <Text size="xs" color="muted">
                    {quotaStatus.message}
                </Text>
            </Flex>
        </Card>
    );
};