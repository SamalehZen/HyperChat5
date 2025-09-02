import { QuotaInfo } from './types';

export class QuotaTracker {
    private storageKey = 'google-vision-quota';
    private monthlyLimit: number;

    constructor(monthlyLimit: number = 1000) {
        this.monthlyLimit = monthlyLimit;
    }

    private getStorageData(): { used: number; month: string; resetDate: string } {
        if (typeof localStorage === 'undefined') {
            return { used: 0, month: '', resetDate: '' };
        }

        const data = localStorage.getItem(this.storageKey);
        if (!data) {
            return { used: 0, month: '', resetDate: '' };
        }

        try {
            return JSON.parse(data);
        } catch {
            return { used: 0, month: '', resetDate: '' };
        }
    }

    private setStorageData(data: { used: number; month: string; resetDate: string }) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        }
    }

    private getCurrentMonth(): string {
        return new Date().toISOString().slice(0, 7); // YYYY-MM format
    }

    private getNextResetDate(): Date {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;
    }

    async getCurrentQuota(): Promise<QuotaInfo> {
        const currentMonth = this.getCurrentMonth();
        const storedData = this.getStorageData();

        // Reset if new month
        if (storedData.month !== currentMonth) {
            const resetDate = this.getNextResetDate();
            const newData = {
                used: 0,
                month: currentMonth,
                resetDate: resetDate.toISOString(),
            };
            this.setStorageData(newData);
            
            return {
                used: 0,
                remaining: this.monthlyLimit,
                resetDate,
                limit: this.monthlyLimit,
            };
        }

        return {
            used: storedData.used,
            remaining: Math.max(0, this.monthlyLimit - storedData.used),
            resetDate: new Date(storedData.resetDate),
            limit: this.monthlyLimit,
        };
    }

    async recordUsage(count: number = 1): Promise<QuotaInfo> {
        const currentMonth = this.getCurrentMonth();
        const storedData = this.getStorageData();

        // Reset if new month
        if (storedData.month !== currentMonth) {
            const newData = {
                used: count,
                month: currentMonth,
                resetDate: this.getNextResetDate().toISOString(),
            };
            this.setStorageData(newData);
        } else {
            // Update existing usage
            const updatedData = {
                ...storedData,
                used: storedData.used + count,
            };
            this.setStorageData(updatedData);
        }

        return this.getCurrentQuota();
    }

    async canUseGoogleVision(requestCount: number = 1): Promise<boolean> {
        const quota = await this.getCurrentQuota();
        return quota.remaining >= requestCount;
    }

    async getUsageStats(): Promise<{
        currentMonth: QuotaInfo;
        isNearLimit: boolean;
        shouldFallback: boolean;
    }> {
        const currentMonth = await this.getCurrentQuota();
        const usagePercentage = (currentMonth.used / currentMonth.limit) * 100;

        return {
            currentMonth,
            isNearLimit: usagePercentage >= 80, // Warning at 80%
            shouldFallback: usagePercentage >= 95, // Force fallback at 95%
        };
    }

    // Server-side alternative using file system (for production)
    async recordUsageServer(count: number = 1): Promise<void> {
        // This would integrate with your database
        // For now, we'll use localStorage approach
        await this.recordUsage(count);
    }

    async reset(): Promise<void> {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.storageKey);
        }
    }
}