import React from 'react';
import { Settings } from '../types';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';
import { useTranslation } from '../contexts/LanguageContext';
import ColorPickerControl from './ColorPickerControl';

interface TextSettingsProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const TextSettings: React.FC<TextSettingsProps> = ({ settings, onSettingsChange }) => {
    const { t } = useTranslation();
    
    return (
        <SettingGroup title={t('text.title')}>
            {/* This selector is now only shown for Image stickers */}
            {settings.stickerType === 'IMAGE' && (
                <OptionSelector
                    name="textMode"
                    value={settings.textMode}
                    onChange={(val) => onSettingsChange('textMode', val)}
                    options={[
                        { value: 'NO_TEXT', label: t('text.mode.noText') },
                        { value: 'CUSTOM_TEXT', label: t('text.mode.customText') },
                    ]}
                />
            )}

            {/* For text stickers, text is always on. For image stickers, it depends on the mode. */}
            {(settings.stickerType === 'TEXT' || settings.textMode === 'CUSTOM_TEXT') && (
                <div className={settings.stickerType === 'IMAGE' ? "mt-4 space-y-4" : "space-y-4"}>
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 pr-14 bg-white"
                            placeholder={t('text.placeholder')}
                            value={settings.customText}
                            onChange={(e) => onSettingsChange('customText', e.target.value)}
                            maxLength={150}
                        />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            {settings.customText.length} / 150
                        </span>
                    </div>

                    {settings.stickerType === 'TEXT' && (
                         <div className="p-3 bg-sky-50 border-l-4 border-sky-400 rounded-r-lg text-sm text-sky-800">
                            <h4 className="font-bold mb-1">{t('text.stabilityTip.title')}</h4>
                            <p>{t('text.stabilityTip.content')}</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>{t('text.stabilityTip.action1')}</li>
                                <li>{t('text.stabilityTip.action2')}</li>
                                <li>{t('text.stabilityTip.action3')}</li>
                            </ul>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('text.color')}</h4>
                        <ColorPickerControl
                            color={settings.textColor}
                            onChange={(color) => onSettingsChange('textColor', color)}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">{t('text.shape')}</h4>
                        <OptionSelector
                            name="textShape"
                            value={settings.textShape}
                            onChange={(val) => onSettingsChange('textShape', val)}
                            options={[
                                { value: 'STRAIGHT', label: t('text.shape.straight') },
                                { value: 'ARCH_UP', label: t('text.shape.archUp') },
                                { value: 'ARCH_DOWN', label: t('text.shape.archDown') },
                                { value: 'CIRCULAR', label: t('text.shape.circular') },
                            ]}
                             gridCols="grid-cols-2"
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">{
                            settings.stickerType === 'IMAGE' ? t('text.sizeAndPosition') : t('text.size')
                        }</h4>
                         <div className={`grid ${settings.stickerType === 'IMAGE' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                           <OptionSelector
                                name="textSize"
                                value={settings.textSize}
                                onChange={(val) => onSettingsChange('textSize', val)}
                                options={[
                                    { value: 'SMALL', label: t('text.size.small') },
                                    { value: 'MEDIUM', label: t('text.size.medium') },
                                    { value: 'LARGE', label: t('text.size.large') },
                                ]}
                                gridCols="grid-cols-1"
                            />
                            {settings.stickerType === 'IMAGE' && (
                                <OptionSelector
                                    name="textPosition"
                                    value={settings.textPosition}
                                    onChange={(val) => onSettingsChange('textPosition', val)}
                                    options={[
                                        { value: 'TOP', label: t('text.position.top') },
                                        { value: 'BOTTOM', label: t('text.position.bottom') },
                                        { value: 'INTEGRATED', label: t('text.position.integrated') },
                                        { value: 'AROUND', label: t('text.position.around') },
                                    ]}
                                     gridCols="grid-cols-2"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SettingGroup>
    );
};

export default TextSettings;