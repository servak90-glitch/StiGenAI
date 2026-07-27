
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Preset, License } from '../types';
import PresetManager from './PresetManager';
import { GuideIcon } from './Icons';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenPatchNotes: () => void;
    onOpenInstructions: () => void;
    onOpenScanner: () => void; // Kept in interface but unused in UI
    onOpenUpscaler: () => void;
    onOpenProcessor: () => void;
    onOpenDevForge: () => void;
    onReset: () => void;
    onLogout: () => void;
    onOpenLicenseGenerator?: () => void; 
    onOpenApiKey?: () => void;
    presets: Preset[];
    onSaveOrUpdatePreset: (name: string) => void;
    onApplyPreset: (id: string) => void;
    onDeletePreset: (id: string) => void;
    selectedPresetId: string;
    isDevMode: boolean;
    license: License;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
    isOpen, onClose, onOpenPatchNotes, onOpenInstructions, onOpenUpscaler, onOpenProcessor, onOpenDevForge, onReset, onLogout, onOpenLicenseGenerator, onOpenApiKey,
    presets, onSaveOrUpdatePreset, onApplyPreset, onDeletePreset, selectedPresetId, isDevMode, license
}) => {
    const { t, language, setLanguage } = useTranslation();

    if (!isOpen) return null;

    const toggleLanguage = () => {
        setLanguage(language === 'ru' ? 'en' : 'ru');
    };

    return (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col sm:hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">{t('menu.title')}</h2>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                
                {/* Presets Section */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t('presets.title')}</h3>
                     <PresetManager 
                        presets={presets}
                        onSaveOrUpdate={onSaveOrUpdatePreset}
                        onApply={(id) => { onApplyPreset(id); onClose(); }}
                        onDelete={onDeletePreset}
                        selectedPresetId={selectedPresetId}
                    />
                </section>
                
                <hr className="border-slate-100" />

                 {/* Tools Section */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t('menu.tools')}</h3>
                    
                    {/* Reset doesn't change modal state, so we must manually close menu */}
                    <button onClick={() => { onReset(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition">
                         <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                        </svg>
                        {t('preview.reset')}
                    </button>

                    {license.features.allowUpscale && (
                        <button onClick={onOpenUpscaler} className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition">
                            <span className="text-lg">🚀</span>
                            {t('upscaler.title')}
                        </button>
                    )}

                    {license.features.allowVector && (
                        <button onClick={onOpenProcessor} className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-50 text-cyan-700 font-semibold hover:bg-cyan-100 transition">
                            <span className="text-lg">✨</span>
                            {t('processor.title')}
                        </button>
                    )}

                    {/* ADMIN TOOLS - Highlighted */}
                    {isDevMode && (
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                             <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="text-base">🍌</span> ADMIN ZONE
                             </h3>
                            
                            <button onClick={onOpenDevForge} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition mb-2">
                                <span className="text-lg">⚒️</span>
                                {t('header.forge')}
                            </button>

                            <button 
                                onClick={() => onOpenLicenseGenerator && onOpenLicenseGenerator()} 
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-yellow-100 text-yellow-800 font-bold hover:bg-yellow-200 transition shadow-sm border border-yellow-300 mb-2"
                            >
                                <span className="text-lg">🔑</span>
                                ГЕНЕРАТОР КЛЮЧЕЙ
                            </button>
                        </div>
                    )}
                </section>

                <hr className="border-slate-100" />

                {/* App Info Section */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t('menu.app')}</h3>
                    
                    {onOpenApiKey && (
                        <button onClick={() => { onOpenApiKey(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 transition border border-amber-200">
                            <span className="text-lg">🔑</span>
                            <span>Настройка API ключа Gemini</span>
                        </button>
                    )}

                    <button onClick={onOpenInstructions} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition">
                        <GuideIcon size={20} />
                        {t('header.instructions')}
                    </button>
                    <button onClick={onOpenPatchNotes} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {t('header.whatsNew')}
                    </button>
                    <button onClick={toggleLanguage} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition">
                        <span className="font-bold border border-slate-300 rounded px-1 text-xs">{language === 'ru' ? 'EN' : 'RU'}</span>
                        {language === 'ru' ? 'English' : 'Русский'}
                    </button>

                    <button 
                        onClick={() => { onLogout(); onClose(); }} 
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-800 font-bold hover:bg-red-100 transition shadow-sm border border-red-300 mt-4"
                    >
                        <span className="text-lg">🚪</span>
                        {t('action.logout')}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default MobileMenu;
