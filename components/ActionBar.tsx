
import React, { useCallback, useState } from 'react';
import { PromptData, Preset } from '../types';
import PresetManager from './PresetManager';
import { useTranslation } from '../contexts/LanguageContext';

interface ActionBarProps {
    promptData: PromptData;
    onReset: () => void;
    presets: Preset[];
    onSaveOrUpdatePreset: (name: string) => void;
    onApplyPreset: (id: string) => void;
    onDeletePreset: (id: string) => void;
    selectedPresetId: string;
    onGenerate: () => void;
}

const ActionBar: React.FC<ActionBarProps> = (props) => {
    const { promptData, onReset, presets, onSaveOrUpdatePreset, onApplyPreset, onDeletePreset, selectedPresetId, onGenerate } = props;
    const { t } = useTranslation();
    const [isCopied, setIsCopied] = useState(false);
    const formattedPrompt = JSON.stringify(promptData, null, 2);

    const copyPrompt = useCallback(() => {
        navigator.clipboard.writeText(formattedPrompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, [formattedPrompt]);

    const copyButtonText = isCopied ? t('preview.copied') : t('preview.copy');

    return (
        <div className="hidden sm:flex flex-shrink-0 bg-transparent p-4 border-b border-white/20 flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 sticky top-0 z-10">
             <div className="w-full sm:flex-grow sm:max-w-md">
                <PresetManager 
                    presets={presets}
                    onSaveOrUpdate={onSaveOrUpdatePreset}
                    onApply={onApplyPreset}
                    onDelete={onDeletePreset}
                    selectedPresetId={selectedPresetId}
                />
            </div>
            <div className="w-full sm:w-auto flex items-center gap-3">
                 <button
                    onClick={onGenerate}
                    className="flex-grow sm:flex-grow-0 ios-btn ios-btn-primary px-8 py-3 text-base"
                >
                    <span className="text-xl leading-none filter drop-shadow-sm mr-2">🍌</span>
                    <span>{t('generator.button')}</span>
                </button>

                <button
                    onClick={onReset}
                    className="group ios-btn w-12 h-12 p-0 bg-white/10"
                    title={t('preview.reset')}
                >
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                    </svg>
                </button>
                 <button
                    onClick={copyPrompt}
                    className={`ios-btn px-5 py-3 gap-2 min-w-[100px] bg-white/10 ${isCopied ? '!bg-green-100/50 !text-green-800' : ''}`}
                >
                    <div className="relative w-5 h-5">
                        <svg className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isCopied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                         <svg className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${isCopied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span>{copyButtonText}</span>
                </button>
            </div>
        </div>
    );
};

export default ActionBar;
