import React from 'react';
import { Settings } from '../types';
import SettingGroup from './SettingGroup';
import ToggleSwitch from './ToggleSwitch';
import { useTranslation } from '../contexts/LanguageContext';

interface BackgroundSettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({ settings, onSettingsChange }) => {
    const { t } = useTranslation();
    const isIsolationMode = settings.stickerMode === 'ISOLATION';

    if (isIsolationMode) {
        return (
            <SettingGroup title={t('category.title.background')}>
                <div className="bg-sky-50 border-l-4 border-sky-400 p-4 rounded-r-lg text-sm text-sky-800" role="alert">
                    <p className="font-semibold">{t('background.isolationInfo')}</p>
                </div>
            </SettingGroup>
        );
    }
    
    // Logic for CONTAINER mode
    const canLockBackground = settings.styleBackground;

    return (
        <SettingGroup title={t('category.title.background')}>
            <div className="space-y-3">
                <ToggleSwitch 
                    id="styleBackground" 
                    label={t('background.styleBackground')} 
                    checked={settings.styleBackground} 
                    onChange={(c) => onSettingsChange('styleBackground', c)}
                />
                <ToggleSwitch 
                    id="backgroundLock" 
                    label={t('background.lockBackground')}
                    checked={settings.backgroundLock} 
                    onChange={(c) => onSettingsChange('backgroundLock', c)}
                    disabled={!canLockBackground}
                    disabledReason={!settings.styleBackground ? t('background.disabled.lock') : ''}
                />
            </div>
        </SettingGroup>
    );
};

export default BackgroundSettings;