/**
 * Client-safe OCR utilities - NO server-side dependencies
 * This file contains only browser-compatible code
 */

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
 * Client-side quota tracker using localStorage
 * Safe to use in React components
 */
export class ClientQuotaTracker {
    private readonly STORAGE_KEY = 'ocr-quota-usage';
    private readonly monthlyLimit: number;

    constructor(monthlyLimit: number = 1000) {
        this.monthlyLimit = monthlyLimit;
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

/**
 * Check if Google Vision API key is available
 */
export function hasGoogleVisionApiKey(): boolean {
    if (typeof window === 'undefined') return false;
    
    const apiKey = localStorage.getItem('google-vision-api-key');
    return !!apiKey && apiKey.length > 0;
}

/**
 * Get OCR quota status for UI display (client-safe)
 */
export async function getOCRQuotaStatus() {
    try {
        // Use client-safe quota tracker
        const tracker = new ClientQuotaTracker();
        return await tracker.getQuotaStatus();
    } catch (error) {
        console.error('Failed to get OCR quota status:', error);
        return {
            percentage: 0,
            status: 'green' as const,
            message: 'Statut du quota indisponible',
        };
    }
}

/**
 * Get current OCR quota usage
 */
export async function getOCRQuotaUsage() {
    try {
        const tracker = new ClientQuotaTracker();
        return await tracker.getCurrentUsage();
    } catch (error) {
        console.error('Failed to get OCR quota usage:', error);
        return {
            used: 0,
            remaining: 1000,
            month: new Date().toISOString().slice(0, 7),
            resetDate: new Date(),
        };
    }
}