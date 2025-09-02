import React, { useEffect, useState } from 'react';
import { Card, Flex, Input, Switch, Text, Button } from '@repo/ui';
import { OCRQuotaDisplay } from './ocr-quota-display';
import { ClientQuotaTracker, hasGoogleVisionApiKey } from '@repo/shared/utils/ocr-client';

interface OCRSettings {
    googleVisionEnabled: boolean;
    tesseractFallbackEnabled: boolean;
    monthlyQuota: number;
    tesseractLanguage: string;
}

export const OCRSettings: React.FC = () => {
    const [settings, setSettings] = useState<OCRSettings>({
        googleVisionEnabled: true,
        tesseractFallbackEnabled: true,
        monthlyQuota: 1000,
        tesseractLanguage: 'fra+eng',
    });

    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        // Load settings from localStorage or environment
        const savedSettings = localStorage.getItem('ocr-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error('Failed to parse OCR settings:', error);
            }
        }

        // Check if Google Vision API key is configured
        setHasApiKey(hasGoogleVisionApiKey());
    }, []);

    const saveSettings = (newSettings: Partial<OCRSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('ocr-settings', JSON.stringify(updated));
    };

    const handleResetQuota = async () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le quota OCR ?')) {
            try {
                const tracker = new ClientQuotaTracker(settings.monthlyQuota);
                await tracker.resetQuota();
                
                // Trigger a refresh of quota display
                window.location.reload();
            } catch (error) {
                console.error('Failed to reset quota:', error);
                alert('Erreur lors de la réinitialisation du quota.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Text size="lg" weight="semibold" className="mb-2">
                    Configuration OCR
                </Text>
                <Text size="sm" color="muted">
                    Configurez les services OCR pour l'extraction de texte à partir de PDFs.
                </Text>
            </div>

            {/* Google Vision Configuration */}
            <Card className="p-4">
                <Flex direction="column" gap="4">
                    <Flex align="center" justify="between">
                        <div>
                            <Text weight="medium">Google Vision API</Text>
                            <Text size="sm" color="muted">
                                Service OCR principal avec haute précision
                            </Text>
                        </div>
                        <Switch
                            checked={settings.googleVisionEnabled && hasApiKey}
                            onCheckedChange={(enabled) => saveSettings({ googleVisionEnabled: enabled })}
                            disabled={!hasApiKey}
                        />
                    </Flex>

                    {!hasApiKey && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <Text size="sm" color="muted">
                                ⚠️ Clé API Google Vision non configurée. 
                                Ajoutez GOOGLE_VISION_API_KEY dans vos variables d'environnement.
                            </Text>
                        </div>
                    )}

                    {hasApiKey && (
                        <div>
                            <Text size="sm" weight="medium" className="mb-2">Quota mensuel</Text>
                            <Input
                                type="number"
                                value={settings.monthlyQuota}
                                onChange={(e) => saveSettings({ monthlyQuota: parseInt(e.target.value) || 1000 })}
                                min="100"
                                max="10000"
                                className="w-32"
                            />
                            <Text size="xs" color="muted" className="mt-1">
                                Nombre maximum de requêtes par mois
                            </Text>
                        </div>
                    )}
                </Flex>
            </Card>

            {/* Tesseract Fallback Configuration */}
            <Card className="p-4">
                <Flex direction="column" gap="4">
                    <Flex align="center" justify="between">
                        <div>
                            <Text weight="medium">Tesseract (Fallback)</Text>
                            <Text size="sm" color="muted">
                                OCR local de secours, gratuit mais moins précis
                            </Text>
                        </div>
                        <Switch
                            checked={settings.tesseractFallbackEnabled}
                            onCheckedChange={(enabled) => saveSettings({ tesseractFallbackEnabled: enabled })}
                        />
                    </Flex>

                    {settings.tesseractFallbackEnabled && (
                        <div>
                            <Text size="sm" weight="medium" className="mb-2">Langues</Text>
                            <Input
                                value={settings.tesseractLanguage}
                                onChange={(e) => saveSettings({ tesseractLanguage: e.target.value })}
                                placeholder="fra+eng"
                                className="w-48"
                            />
                            <Text size="xs" color="muted" className="mt-1">
                                Codes de langues séparés par + (ex: fra+eng pour français et anglais)
                            </Text>
                        </div>
                    )}
                </Flex>
            </Card>

            {/* Quota Status */}
            {hasApiKey && settings.googleVisionEnabled && (
                <div>
                    <Flex align="center" justify="between" className="mb-3">
                        <Text weight="medium">Utilisation actuelle</Text>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleResetQuota}
                        >
                            Réinitialiser
                        </Button>
                    </Flex>
                    <OCRQuotaDisplay />
                </div>
            )}

            {/* Help Section */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <Text size="sm" weight="medium" className="mb-2">💡 Comment ça marche</Text>
                <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Les PDFs sont automatiquement traités par OCR lors de l'upload</li>
                    <li>• Google Vision est utilisé en priorité si disponible et dans les limites du quota</li>
                    <li>• Tesseract prend le relais automatiquement si Google Vision est indisponible</li>
                    <li>• Le texte extrait est ajouté au contexte de conversation</li>
                </ul>
            </Card>
        </div>
    );
};