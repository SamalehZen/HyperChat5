import { Badge, Button, Flex } from '@repo/ui';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuotaInfo {
    used: number;
    remaining: number;
    resetDate: Date;
    limit: number;
}

export const OCRQuotaStatus = () => {
    const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadQuotaInfo = async () => {
        setIsLoading(true);
        try {
            // This would call your OCR manager in a real implementation
            // For now, simulate the quota check
            const mockQuota: QuotaInfo = {
                used: 750,
                remaining: 250,
                limit: 1000,
                resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
            };
            setQuotaInfo(mockQuota);
        } catch (error) {
            console.error('Failed to load quota info:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isVisible) {
            loadQuotaInfo();
        }
    }, [isVisible]);

    if (!isVisible) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="text-xs"
            >
                <Eye size={12} />
                OCR Quota
            </Button>
        );
    }

    const getUsageColor = (percentage: number) => {
        if (percentage >= 95) return 'destructive';
        if (percentage >= 80) return 'secondary';
        return 'default';
    };

    const usagePercentage = quotaInfo ? (quotaInfo.used / quotaInfo.limit) * 100 : 0;

    return (
        <Flex gap="xs" items="center" className="text-xs">
            <Badge variant={quotaInfo ? getUsageColor(usagePercentage) : 'secondary'}>
                {quotaInfo ? `${quotaInfo.used}/${quotaInfo.limit}` : 'Loading...'}
            </Badge>
            
            <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => loadQuotaInfo()}
                disabled={isLoading}
                className="h-4 w-4"
            >
                <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
            </Button>
            
            <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsVisible(false)}
                className="h-4 w-4"
            >
                <EyeOff size={10} />
            </Button>
        </Flex>
    );
};