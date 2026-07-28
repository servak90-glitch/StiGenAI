import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Preset, License } from '../types';
import PresetManager from './PresetManager';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenPatchNotes: () => void;
    onOpenInstructions: () => void;
    onOpenWizard: () => void;
    onOpenHistory: () => void;
    onOpenUpscaler: () => void;
    onOpenProcessor: () => void;
    onOpenDevForge: () => void;
    onOpenLicenseGenerator?: () => void; 
    onOpenApiKey?: () => void;
    onCopy: () => void;
    onReset: () => void;
    presets: Preset[];
    onSaveOrUpdatePreset: (name: string) => void;
    onApplyPreset: (id: string) => void;
    onDeletePreset: (id: string) => void;
    selectedPresetId: string;
    isDevMode: boolean;
    license: License;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
    isOpen, onClose, onOpenPatchNotes, onOpenInstructions, onOpenWizard, onOpenHistory, onOpenDevForge, onOpenLicenseGenerator, onOpenApiKey, onCopy, onReset,
    presets, onSaveOrUpdatePreset, onApplyPreset, onDeletePreset, selectedPresetId, isDevMode, license
}) => {
    const { t, language, setLanguage } = useTranslation();

    if (!isOpen) return null;

    const toggleLanguage = () => {
        setLanguage(language === 'ru' ? 'en' : 'ru');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">⚙️</span>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t('menu.title')}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition active:scale-95"
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* Quick Settings & Tools Grid */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t('menu.tools')}</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* API KEY */}
                            {onOpenApiKey && (
                                <button 
                                    onClick={() => { onOpenApiKey(); onClose(); }} 
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200/80 transition text-left text-xs sm:text-sm"
                                >
                                    <span className="text-xl p-2 bg-amber-100/80 rounded-xl">🔑</span>
                                    <span>Gemini API Key</span>
                                </button>
                            )}

                            {/* COPY PROMPT JSON */}
                            <button 
                                onClick={() => { onCopy(); onClose(); }} 
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold border border-indigo-200/80 transition text-left text-xs sm:text-sm"
                            >
                                <span className="text-xl p-2 bg-indigo-100/80 rounded-xl">🧠</span>
                                <span>Copy Prompt JSON</span>
                            </button>

                            {/* WIZARD */}
                            {license.features.allowStickers && (
                                <button 
                                    onClick={() => { onOpenWizard(); onClose(); }} 
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold border border-purple-200/80 transition text-left text-xs sm:text-sm"
                                >
                                    <span className="text-xl p-2 bg-purple-100/80 rounded-xl">🧙‍♂️</span>
                                    <span>{t('dashboard.wizard')}</span>
                                </button>
                            )}

                            {/* HISTORY */}
                            {license.features.allowPro && (
                                <button 
                                    onClick={() => { onOpenHistory(); onClose(); }} 
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold border border-sky-200/80 transition text-left text-xs sm:text-sm"
                                >
                                    <span className="text-xl p-2 bg-sky-100/80 rounded-xl">🕰️</span>
                                    <span>{t('dashboard.history')}</span>
                                </button>
                            )}

                            {/* LANGUAGE TOGGLE */}
                            <button 
                                onClick={toggleLanguage} 
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold border border-slate-200/80 transition text-left text-xs sm:text-sm"
                            >
                                <span className="text-sm font-black p-2 bg-white rounded-xl border border-slate-200 text-indigo-600">
                                    {language === 'ru' ? 'EN' : 'RU'}
                                </span>
                                <span>{language === 'ru' ? 'English Language' : 'Русский язык'}</span>
                            </button>

                            {/* INSTRUCTIONS */}
                            <button 
                                onClick={() => { onOpenInstructions(); onClose(); }} 
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200/80 transition text-left text-xs sm:text-sm"
                            >
                                <span className="text-xl p-2 bg-slate-200/60 rounded-xl">📖</span>
                                <span>{t('header.instructions')}</span>
                            </button>

                            {/* PATCH NOTES */}
                            <button 
                                onClick={() => { onOpenPatchNotes(); onClose(); }} 
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200/80 transition text-left text-xs sm:text-sm"
                            >
                                <span className="text-xl p-2 bg-slate-200/60 rounded-xl">🎉</span>
                                <span>{t('header.whatsNew')}</span>
                            </button>

                            {/* RESET SETTINGS */}
                            <button 
                                onClick={() => { onReset(); onClose(); }} 
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200/80 transition text-left text-xs sm:text-sm"
                            >
                                <span className="text-xl p-2 bg-rose-100/80 rounded-xl">🔄</span>
                                <span>{t('preview.reset')}</span>
                            </button>
                        </div>
                    </section>

                    {/* Presets Section */}
                    <section className="pt-2">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">{t('presets.title')}</h3>
                        <PresetManager 
                            presets={presets}
                            onSaveOrUpdate={onSaveOrUpdatePreset}
                            onApply={(id) => { onApplyPreset(id); onClose(); }}
                            onDelete={onDeletePreset}
                            selectedPresetId={selectedPresetId}
                        />
                    </section>

                    {/* Developer / Admin Zone */}
                    {isDevMode && (
                        <section className="pt-3 border-t border-dashed border-slate-200">
                            <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span>🍌</span> ADMIN ZONE
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button 
                                    onClick={() => { onOpenDevForge(); onClose(); }} 
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 transition text-xs"
                                >
                                    <span className="text-lg">⚒️</span>
                                    <span>{t('header.forge')}</span>
                                </button>
                                {onOpenLicenseGenerator && (
                                    <button 
                                        onClick={() => { onOpenLicenseGenerator(); onClose(); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-bold border border-yellow-300 transition text-xs"
                                    >
                                        <span className="text-lg">🔑</span>
                                        <span>ГЕНЕРАТОР КЛЮЧЕЙ</span>
                                    </button>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;
