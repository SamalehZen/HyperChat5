export interface QuotaUsage {
    used: number;
    remaining: number;
    month: string;
    resetDate: Date;
}

export interface UsageRecord {
    date: string;
    method: 'google-vision' | 'tesseract';
    count: number;
}

/**
 * Local storage-based quota tracking (no database required)
 */
export class QuotaTracker {
    private readonly STORAGE_KEY = 'ocr-quota-usage';
    private readonly monthlyLimit: number;

    constructor(monthlyLimit: number = 1000) {
        this.monthlyLimit = monthlyLimit;
    }

    /**
     * Record OCR usage
     */
    async recordUsage(method: 'google-vision' | 'tesseract'): Promise<void> {
        // Only track Google Vision usage for quota management
        if (method !== 'google-vision') return;

        try {
            const usage = this.getStoredUsage();
            const currentMonth = this.getCurrentMonthKey();

            if (usage.month !== currentMonth) {
                // Reset usage for new month
                usage.month = currentMonth;
                usage.used = 0;
                usage.resetDate = this.getNextResetDate();
            }

            usage.used += 1;
            usage.remaining = Math.max(0, this.monthlyLimit - usage.used);

            this.saveUsage(usage);

            // Log usage for monitoring
            console.log(`OCR Usage: ${usage.used}/${this.monthlyLimit} (${method})`);
        } catch (error) {
            console.error('Failed to record OCR usage:', error);
        }
    }

    /**
     * Get current usage statistics
     */
    async getCurrentUsage(): Promise<QuotaUsage> {
        const usage = this.getStoredUsage();
        const currentMonth = this.getCurrentMonthKey();

        if (usage.month !== currentMonth) {
            // Reset for new month
            return {
                used: 0,
                remaining: this.monthlyLimit,
                month: currentMonth,
                resetDate: this.getNextResetDate(),
            };
        }

        return usage;
    }

    /**
     * Check if Google Vision should be used based on quota
     */
    async shouldUseGoogleVision(): Promise<boolean> {
        const usage = await this.getCurrentUsage();
        
        // Add 10% buffer before hitting limit
        const bufferLimit = Math.floor(this.monthlyLimit * 0.9);
        
        return usage.used < bufferLimit;
    }

    /**
     * Get quota status for UI display
     */
    async getQuotaStatus(): Promise<{
        percentage: number;
        status: 'green' | 'yellow' | 'red';
        message: string;
    }> {
        const usage = await this.getCurrentUsage();
        const percentage = (usage.used / this.monthlyLimit) * 100;

        if (percentage < 70) {
            return {
                percentage,
                status: 'green',
                message: `${usage.remaining} requêtes restantes ce mois`,
            };
        } else if (percentage < 90) {
            return {
                percentage,
                status: 'yellow',
                message: `Attention: ${usage.remaining} requêtes restantes`,
            };
        } else {
            return {
                percentage,
                status: 'red',
                message: `Limite presque atteinte: ${usage.remaining} requêtes restantes`,
            };
        }
    }

    /**
     * Reset quota (admin function)
     */
    async resetQuota(): Promise<void> {
        const currentMonth = this.getCurrentMonthKey();
        const usage: QuotaUsage = {
            used: 0,
            remaining: this.monthlyLimit,
            month: currentMonth,
            resetDate: this.getNextResetDate(),
        };

        this.saveUsage(usage);
    }

    /**
     * Get stored usage from localStorage
     */
    private getStoredUsage(): QuotaUsage {
        if (typeof window === 'undefined') {
            // Server-side fallback
            return this.getDefaultUsage();
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...parsed,
                    resetDate: new Date(parsed.resetDate),
                };
            }
        } catch (error) {
            console.error('Failed to parse stored usage:', error);
        }

        return this.getDefaultUsage();
    }

    /**
     * Save usage to localStorage
     */
    private saveUsage(usage: QuotaUsage): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
        } catch (error) {
            console.error('Failed to save OCR usage:', error);
        }
    }

    /**
     * Get default usage structure
     */
    private getDefaultUsage(): QuotaUsage {
        return {
            used: 0,
            remaining: this.monthlyLimit,
            month: this.getCurrentMonthKey(),
            resetDate: this.getNextResetDate(),
        };
    }

    /**
     * Get current month key (YYYY-MM format)
     */
    private getCurrentMonthKey(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Get next month's first day
     */
    private getNextResetDate(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
}