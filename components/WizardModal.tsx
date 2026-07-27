
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { StickerType, StyleKey, Settings, WizardVibe, StyleCategoryKey } from '../types';
import { STYLE_LIBRARY, INITIAL_SETTINGS } from '../constants';
import SparkleButton from './SparkleButton';

interface WizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (settings: Settings) => void;
}

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose, onComplete }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<StickerType>('IMAGE');
    const [textInput, setTextInput] = useState('');
    const [selectedVibe, setSelectedVibe] = useState<WizardVibe | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);

    if (!isOpen) return null;

    const resetWizard = () => {
        setStep(1);
        setSelectedType('IMAGE');
        setTextInput('');
        setSelectedVibe(null);
        setSelectedStyle(null);
    };

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleFinish = () => {
        if (!selectedStyle) return;
        const newSettings: Settings = { ...INITIAL_SETTINGS };
        newSettings.stickerType = selectedType;
        newSettings.style = selectedStyle;

        if (selectedType === 'TEXT') {
            newSettings.textMode = 'CUSTOM_TEXT';
            newSettings.customText = textInput;
            newSettings.stickerMode = 'CONTAINER'; 
            newSettings.stickerShape = 'SQUARE';
            newSettings.interpretationMode = 'STRICT';
            newSettings.cameraLock = false;
            newSettings.detailLock = false;
            newSettings.poseLock = false;
            newSettings.backgroundLock = false;
        } else {
            newSettings.textMode = 'NO_TEXT';
            newSettings.stickerMode = 'ISOLATION';
            newSettings.interpretationMode = 'STRICT';
        }

        onComplete(newSettings);
        resetWizard();
    };

    const getStylesForVibe = (vibe: WizardVibe): StyleKey[] => {
        const categories: StyleCategoryKey[] = [];
        switch (vibe) {
            case 'FUN': categories.push('GRAPHICS_AND_DESIGN', 'ANIME_AND_CARTOONS'); break;
            case 'ARTSY': categories.push('ART_TECHNIQUES'); break;
            case 'TECH': categories.push('TECHNO_AND_FUTURISM', 'ARCHITECTURE_AND_MINIMALISM'); break;
            case 'WEIRD': categories.push('ABSTRACTION_AND_PSYCHEDELIA'); break;
        }
        return Object.keys(STYLE_LIBRARY).filter(key => 
            categories.includes(STYLE_LIBRARY[key as StyleKey].category)
        ) as StyleKey[];
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800">{t('wizard.step1.title')}</h3>
                <p className="text-slate-500">{t('wizard.step1.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setSelectedType('IMAGE')} className={`p-6 rounded-2xl border-2 text-left transition-all ${selectedType === 'IMAGE' ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}>
                    <div className="text-4xl mb-2">🖼️</div>
                    <div className="font-bold text-lg text-slate-800">{t('wizard.type.image')}</div>
                    <div className="text-sm text-slate-500">{t('wizard.type.image.desc')}</div>
                </button>
                <button onClick={() => setSelectedType('TEXT')} className={`p-6 rounded-2xl border-2 text-left transition-all ${selectedType === 'TEXT' ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-200' : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}>
                    <div className="text-4xl mb-2">📝</div>
                    <div className="font-bold text-lg text-slate-800">{t('wizard.type.text')}</div>
                    <div className="text-sm text-slate-500">{t('wizard.type.text.desc')}</div>
                </button>
            </div>
            {selectedType === 'TEXT' && (
                 <div className="animate-slide-up">
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('wizard.textInput.label')}</label>
                    <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} maxLength={50} placeholder="COOL TEXT" className="w-full text-center text-xl font-bold p-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all uppercase placeholder-slate-300" />
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800">{t('wizard.step2.title')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: 'FUN', emoji: '🎢', label: t('wizard.vibe.fun'), color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
                    { id: 'ARTSY', emoji: '🎨', label: t('wizard.vibe.artsy'), color: 'bg-rose-100 hover:bg-rose-200 border-rose-300' },
                    { id: 'TECH', emoji: '🤖', label: t('wizard.vibe.tech'), color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
                    { id: 'WEIRD', emoji: '🌀', label: t('wizard.vibe.weird'), color: 'bg-purple-100 hover:bg-purple-200 border-purple-300' },
                ].map((vibe) => (
                    <button key={vibe.id} onClick={() => setSelectedVibe(vibe.id as WizardVibe)} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all h-32 md:h-40 ${selectedVibe === vibe.id ? 'ring-4 ring-offset-2 ring-slate-400 border-slate-800 transform scale-105 shadow-xl z-10' : `${vibe.color} border-transparent hover:scale-105 shadow-sm`}`}>
                        <div className="text-4xl md:text-5xl mb-2">{vibe.emoji}</div>
                        <div className="font-bold text-sm md:text-base text-slate-800">{vibe.label}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => {
        if (!selectedVibe) return null;
        const styles = getStylesForVibe(selectedVibe);
        return (
            <div className="space-y-4 animate-fade-in flex flex-col h-full">
                <div className="text-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800">{t('wizard.step3.title')}</h2>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                     <div className="grid grid-cols-2 gap-3 pb-2">
                        {styles.map(key => {
                            const style = STYLE_LIBRARY[key];
                            return (
                                <button key={key} onClick={() => setSelectedStyle(key)} className={`p-3 border rounded-xl text-left transition-all duration-200 ${selectedStyle === key ? 'bg-sky-50 border-2 border-sky-500 ring-2 ring-sky-200 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}>
                                    <div className="text-2xl mb-1">{style.emoji}</div>
                                    <div className="font-bold text-sm text-slate-800 leading-tight break-words">{t(style.nameKey)}</div>
                                    <div className="text-[10px] text-slate-500 mt-1">{t(style.badgeKey)}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-sky-500 text-white' : 'bg-slate-200'}`}>1</span>
                        <div className={`w-8 h-1 ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-sky-500 text-white' : 'bg-slate-200'}`}>2</span>
                        <div className={`w-8 h-1 ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-sky-500 text-white' : 'bg-slate-200'}`}>3</span>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition">✕</button>
                </div>
                <div className="p-6 flex-grow overflow-hidden flex flex-col">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between flex-shrink-0">
                    <button onClick={step === 1 ? handleClose : handleBack} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition">
                         {t('action.back')}
                    </button>
                    {step < 3 ? (
                        <button onClick={handleNext} disabled={(step === 1 && selectedType === 'TEXT' && !textInput.trim()) || (step === 2 && !selectedVibe)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg">
                             {t('action.next')}
                        </button>
                    ) : (
                         <SparkleButton 
                            onClick={handleFinish} 
                            disabled={!selectedStyle} 
                            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg transform hover:-translate-y-1"
                        >
                            {t('wizard.finish')} 🍌
                        </SparkleButton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WizardModal;
