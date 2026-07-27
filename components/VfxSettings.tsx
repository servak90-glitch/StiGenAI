
import React from 'react';
import { Settings, StyleInfo } from '../types';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';
import ToggleSwitch from './ToggleSwitch';
import { useTranslation } from '../contexts/LanguageContext';

interface VfxSettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    styleConfig: StyleInfo;
}

const VfxSettings: React.FC<VfxSettingsProps> = ({ settings, onSettingsChange, styleConfig }) => {
    const { t } = useTranslation();

    if (!styleConfig) {
        return (
            <SettingGroup title={t('vfx.title')}>
                <p className="text-sm text-slate-500 p-2">{t('vfx.disabled.configError')}</p>
            </SettingGroup>
        );
    }
    
    const isVfxDisabled = settings.outlineOnly === 'YES';
    const vfxDisabledReason = isVfxDisabled ? t('vfx.disabled.outlineOnly') : '';

    const isLocked = (key: keyof Settings) => {
        const lockedByStyle = styleConfig.locks?.includes(key);
        const styleName = t(styleConfig.nameKey);
        const reason = lockedByStyle ? `${t('vfx.lockedByStyle')} "${styleName}"` : vfxDisabledReason;
        return {
            locked: isVfxDisabled || !!lockedByStyle,
            reason: reason
        };
    };

    const materialLock = isLocked('materialTexture');
    const sssLock = isLocked('subsurfaceScattering');
    const particleLock = isLocked('particleEffects');
    const lightingLock = isLocked('lightingPreset');
    const vibranceLock = isLocked('colorVibrance');

    return (
        <SettingGroup title={t('vfx.title')}>
            <div className="space-y-4">
                <div title={materialLock.reason}>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('vfx.materialTexture')}</h4>
                    <OptionSelector
                        name="materialTexture"
                        value={settings.materialTexture}
                        onChange={(val) => onSettingsChange('materialTexture', val)}
                        options={[
                            { value: 'STANDARD', label: t('vfx.material.standard') },
                            { value: 'WET', label: t('vfx.material.wet') },
                            { value: 'GLOSSY', label: t('vfx.material.glossy') },
                            { value: 'METALLIC', label: t('vfx.material.metallic') },
                            { value: 'GLASS', label: t('vfx.material.glass') },
                        ]}
                         gridCols="grid-cols-2 md:grid-cols-3"
                         disabled={materialLock.locked}
                    />
                </div>

                 <div title={particleLock.reason}>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('vfx.particleEffects')}</h4>
                    <OptionSelector
                        name="particleEffects"
                        value={settings.particleEffects}
                        onChange={(val) => onSettingsChange('particleEffects', val)}
                        options={[
                            { value: 'NONE', label: t('vfx.particles.none') },
                            { value: 'DROPLETS', label: t('vfx.particles.droplets') },
                            { value: 'MIST', label: t('vfx.particles.mist') },
                            { value: 'SPARKLES', label: t('vfx.particles.sparkles') },
                            { value: 'GLOW', label: t('vfx.particles.glow') },
                        ]}
                         gridCols="grid-cols-2 md:grid-cols-3"
                         disabled={particleLock.locked}
                    />
                </div>

                <div title={lightingLock.reason}>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('vfx.lighting')}</h4>
                    <OptionSelector
                        name="lightingPreset"
                        value={settings.lightingPreset}
                        onChange={(val) => onSettingsChange('lightingPreset', val)}
                        options={[
                            { value: 'STANDARD', label: t('vfx.lighting.standard') },
                            { value: 'RIM_LIGHT', label: t('vfx.lighting.rim') },
                            { value: 'STUDIO', label: t('vfx.lighting.studio') },
                            { value: 'DRAMATIC', label: t('vfx.lighting.dramatic') },
                            { value: 'CINEMATIC', label: t('vfx.lighting.cinematic') },
                        ]}
                         gridCols="grid-cols-2 md:grid-cols-3"
                         disabled={lightingLock.locked}
                    />
                </div>
                
                <ToggleSwitch
                    id="subsurfaceScattering"
                    label={t('vfx.sss.label')}
                    checked={settings.subsurfaceScattering}
                    onChange={(c) => onSettingsChange('subsurfaceScattering', c)}
                    disabled={sssLock.locked}
                    disabledReason={sssLock.reason || t('vfx.sss.tooltip')}
                />

                <div title={vibranceLock.reason} className={`${vibranceLock.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <label htmlFor="colorVibrance" className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
                        <span>{t('vfx.colorVibrance')}</span>
                        <span className="font-bold text-sky-500">{settings.colorVibrance}%</span>
                    </label>
                    <input
                        id="colorVibrance"
                        type="range"
                        min="0"
                        max="100"
                        value={settings.colorVibrance}
                        onChange={(e) => onSettingsChange('colorVibrance', parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        disabled={vibranceLock.locked}
                    />
                </div>
            </div>
        </SettingGroup>
    );
};

export default VfxSettings;
