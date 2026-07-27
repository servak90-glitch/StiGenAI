import React from 'react';
import { Settings, StyleKey, StickerMode, Category, StickerType } from '../types';
import { STYLE_LIBRARY } from '../constants';
import StyleLibrary from './StyleLibrary';
import TextSettings from './TextSettings';
import VfxSettings from './VfxSettings';
import FormatSettings from './FormatSettings';
import QualitySettings from './QualitySettings';
import BackgroundSettings from './BackgroundSettings';
import AdvancedSettings from './AdvancedSettings';
import { useTranslation } from '../contexts/LanguageContext';
import SettingGroup from './SettingGroup';
import OptionSelector from './OptionSelector';

interface SettingsPanelProps {
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    onStyleChange: (style: StyleKey) => void;
    onStickerModeChange: (mode: StickerMode) => void;
    onStickerTypeChange: (type: StickerType) => void;
    activeCategory: Category;
}

const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
    const { settings, onSettingsChange, activeCategory, onStickerTypeChange } = props;
    const { t } = useTranslation();
    const styleConfig = STYLE_LIBRARY[settings.style as StyleKey];

    const renderActiveCategory = () => {
        switch (activeCategory) {
            case 'style':
                return (
                    <>
                        <div className="mb-4">
                            <SettingGroup title={t('format.stickerType')}>
                                <OptionSelector
                                    name="stickerType"
                                    value={settings.stickerType}
                                    onChange={(val) => onStickerTypeChange(val as StickerType)}
                                    options={[
                                        { value: 'IMAGE', label: t('format.stickerType.image') },
                                        { value: 'TEXT', label: t('format.stickerType.text') },
                                    ]}
                                />
                            </SettingGroup>
                        </div>
                        <StyleLibrary 
                            selectedStyle={settings.style} 
                            onSelectStyle={props.onStyleChange}
                            interpretationMode={settings.interpretationMode}
                            onModeChange={(mode) => onSettingsChange('interpretationMode', mode)}
                        />
                        {styleConfig?.tipKey && (
                            <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl text-sm text-indigo-900 shadow-sm transition-all animate-fade-in">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-indigo-800">
                                    💡 {t('style.tip.title')}
                                </h4>
                                <div className="leading-relaxed opacity-90 space-y-2" dangerouslySetInnerHTML={{ __html: t(styleConfig.tipKey) }} />
                            </div>
                        )}
                    </>
                );
            case 'format':
                return <FormatSettings 
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                    onStickerModeChange={props.onStickerModeChange}
                />
            case 'quality':
                return <QualitySettings
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                />
            case 'advanced':
                return <AdvancedSettings
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                />
            case 'background':
                 if (settings.stickerType === 'TEXT') return null;
                return <BackgroundSettings 
                    settings={settings}
                    onSettingsChange={onSettingsChange}
                />;
            case 'text':
                return <TextSettings settings={settings} onSettingsChange={onSettingsChange} />;
            case 'vfx':
                 return <VfxSettings 
                    settings={settings} 
                    onSettingsChange={onSettingsChange}
                    styleConfig={styleConfig}
                />;
            default:
                return null;
        }
    }

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">{t(`category.title.${activeCategory}`)}</h2>
            {renderActiveCategory()}
        </div>
    );
};

export default SettingsPanel;