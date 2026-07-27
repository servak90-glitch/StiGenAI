
import React from 'react';
import { Settings, AspectRatio } from '../types';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';
import { useTranslation } from '../contexts/LanguageContext';

interface AdvancedSettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange }) => {
    const { t } = useTranslation();
    const isPro = settings.modelTier === 'PRO';

    return (
        <div className="space-y-6">
             <SettingGroup title={t('advanced.modelTier')}>
                <div className={`transition-all duration-500 p-1 rounded-2xl ${isPro ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}`}>
                    <OptionSelector
                        name="modelTier"
                        value={settings.modelTier}
                        onChange={(val) => onSettingsChange('modelTier', val)}
                        options={[
                            { value: 'FAST', label: 'Flash 🍌' },
                            { value: 'PRO', label: 'Pro ✨' },
                        ]}
                        gridCols="grid-cols-2"
                    />
                </div>
                {isPro && (
                    <p className="text-[10px] text-indigo-600 mt-2 font-bold animate-pulse text-center">
                        ✨ PRO: Studio Quality enabled. Requires paid GCP API Key.
                    </p>
                )}
            </SettingGroup>

            <SettingGroup title={t('advanced.aspectRatio')}>
                 <OptionSelector
                    name="aspectRatio"
                    value={settings.aspectRatio}
                    onChange={(val) => onSettingsChange('aspectRatio', val as AspectRatio)}
                    options={[
                        { value: '1:1', label: '1:1' },
                        { value: '3:4', label: '3:4' },
                        { value: '4:3', label: '4:3' },
                        { value: '9:16', label: '9:16' },
                        { value: '16:9', label: '16:9' },
                    ]}
                    gridCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                />
            </SettingGroup>
            
            <SettingGroup title={t('advanced.negativePrompt')}>
                <textarea
                    className="ios-input w-full h-24 p-3 text-sm border-none focus:ring-0"
                    placeholder={t('advanced.negativePrompt.placeholder')}
                    value={settings.customNegativePrompt}
                    onChange={(e) => onSettingsChange('customNegativePrompt', e.target.value)}
                />
            </SettingGroup>
        </div>
    );
};

export default AdvancedSettings;
