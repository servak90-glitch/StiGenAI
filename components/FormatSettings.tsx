import React from 'react';
import { Settings, StickerMode } from '../types';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';
import ToggleSwitch from './ToggleSwitch';
import { useTranslation } from '../contexts/LanguageContext';

interface FormatSettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    onStickerModeChange: (mode: StickerMode) => void;
}

const FormatSettings: React.FC<FormatSettingsProps> = ({ settings, onSettingsChange, onStickerModeChange }) => {
    const { t } = useTranslation();
    return (
        <>
            <SettingGroup title={t('format.stickerMode')}>
                <OptionSelector
                    name="stickerMode"
                    value={settings.stickerMode}
                    onChange={(val) => onStickerModeChange(val as StickerMode)}
                    options={[
                        { value: 'ISOLATION', label: t('format.stickerMode.isolation') },
                        { value: 'CONTAINER', label: t('format.stickerMode.container') },
                    ]}
                />
                {/* Container Shape is only for IMAGE + CONTAINER */}
                {settings.stickerType === 'IMAGE' && settings.stickerMode === 'CONTAINER' && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('format.containerShape')}</h4>
                        <OptionSelector
                            name="stickerShape"
                            value={settings.stickerShape}
                            onChange={(val) => onSettingsChange('stickerShape', val)}
                            options={[
                                { value: 'CIRCLE', label: t('format.containerShape.circle') },
                                { value: 'SQUARE', label: t('format.containerShape.square') },
                                { value: 'TRIANGLE', label: t('format.containerShape.triangle') },
                                { value: 'OCTAHEDRON', label: t('format.containerShape.octahedron') },
                            ]}
                            gridCols="grid-cols-2"
                        />
                    </div>
                )}
                {/* Dynamic Frame Info for TEXT + CONTAINER */}
                {settings.stickerType === 'TEXT' && settings.stickerMode === 'CONTAINER' && (
                    <div className="mt-4 p-3 bg-sky-50 border-l-4 border-sky-400 rounded-r-lg text-sm text-sky-800">
                        {t('format.dynamicFrameInfo')}
                    </div>
                )}
            </SettingGroup>

            {/* Composition Lock is only for IMAGE */}
            {settings.stickerType === 'IMAGE' && (
                <SettingGroup title={t('format.compositionLock')}>
                    <div className="space-y-3">
                        <ToggleSwitch id="poseLock" label={t('format.compositionLock.pose')} checked={settings.poseLock} onChange={(c) => onSettingsChange('poseLock', c)} />
                        <ToggleSwitch id="cameraLock" label={t('format.compositionLock.camera')} checked={settings.cameraLock} onChange={(c) => onSettingsChange('cameraLock', c)} />
                    </div>
                </SettingGroup>
            )}
        </>
    );
};

export default FormatSettings;