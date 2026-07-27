import React from 'react';
import { Settings } from '../types';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';
import ToggleSwitch from './ToggleSwitch';
import { useTranslation } from '../contexts/LanguageContext';

interface QualitySettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const QualitySettings: React.FC<QualitySettingsProps> = ({ settings, onSettingsChange }) => {
    const { t } = useTranslation();

    return (
        <>
            <SettingGroup title={t('quality.generation')}>
                <OptionSelector
                    name="quality"
                    value={settings.quality}
                    onChange={(val) => onSettingsChange('quality', val)}
                    options={[
                        { value: 'STANDARD', label: t('quality.generation.standard') },
                        { value: 'PREMIUM', label: t('quality.generation.premium') },
                        { value: 'ULTRA', label: t('quality.generation.ultra') },
                        { value: 'MASTER', label: t('quality.generation.master') },
                    ]}
                     gridCols="grid-cols-2"
                />
            </SettingGroup>

            <SettingGroup title={t('quality.renderStyle')}>
                 <div className="space-y-3">
                     <ToggleSwitch
                        id="vectorMode"
                        label={t('quality.renderStyle.vector')}
                        checked={settings.vector === 'YES'}
                        onChange={(c) => onSettingsChange('vector', c ? 'YES' : 'NO')}
                    />
                    <ToggleSwitch
                        id="outlineOnly"
                        label={t('quality.renderStyle.outlineOnly')}
                        checked={settings.outlineOnly === 'YES'}
                        onChange={(c) => onSettingsChange('outlineOnly', c ? 'YES' : 'NO')}
                    />
                </div>
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2">{t('quality.lineWeight')}</h4>
                    <OptionSelector
                        name="outlineWeight"
                        value={settings.outlineWeight}
                        onChange={(val) => onSettingsChange('outlineWeight', val)}
                        options={[
                            { value: 'THIN', label: t('quality.lineWeight.thin') },
                            { value: 'MEDIUM', label: t('quality.lineWeight.medium') },
                            { value: 'THICK', label: t('quality.lineWeight.thick') },
                        ]}
                    />
                </div>
            </SettingGroup>

            {settings.stickerType === 'IMAGE' && (
                <SettingGroup title={t('quality.detailPreservation')}>
                    <div className="space-y-3">
                        <ToggleSwitch id="detailLock" label={t('quality.detailPreservation.lock')} checked={settings.detailLock} onChange={(c) => onSettingsChange('detailLock', c)} />
                    </div>
                </SettingGroup>
            )}
        </>
    );
};

export default QualitySettings;