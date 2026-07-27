
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { License } from '../types';
import { 
    BananaIcon, 
    LogoutIcon, 
    GuideIcon, 
    WhatsNewIcon,
    ForgeIcon,
    BrainIcon
} from './Icons';

interface HeaderProps {
    onOpenPatchNotes: () => void;
    onOpenInstructions: () => void;
    onOpenWizard: () => void;
    onOpenMobileMenu: () => void;
    onCopy: () => void;
    onOpenHistory: () => void;
    onOpenUpscaler: () => void;
    onOpenProcessor: () => void;
    onOpenDevForge: () => void;
    onOpenLicenseGenerator: () => void;
    onOpenApiKey?: () => void;
    onLogout: () => void;
    onLogoClick: () => void;
    isDevMode: boolean;
    license?: License | null;
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenPatchNotes, onOpenInstructions, onOpenWizard, onOpenMobileMenu, onCopy, onLogout, onLogoClick, onOpenHistory, onOpenDevForge, onOpenLicenseGenerator, onOpenApiKey, isDevMode, license
}) => {
    const { t, language, setLanguage } = useTranslation();
    const [isCopied, setIsCopied] = useState(false);

    const toggleLanguage = () => {
        setLanguage(language === 'ru' ? 'en' : 'ru');
    };

    const handleCopy = () => {
        onCopy();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
    
    return (
        <header className="p-4 border-b border-white/20 flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 z-40 relative">
            <div 
                className="text-left flex-shrink-0 flex items-center gap-3 cursor-pointer select-none"
                onClick={onLogoClick}
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-lg transform -rotate-6 transition-transform active:scale-95 text-white">
                    <BananaIcon size={24} />
                </div>
                <div>
                    <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-800 leading-tight text-shadow-sm">
                        <span className="sm:hidden">{t('header.title.mobile')}</span>
                        <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">{t('header.title')}</span>
                    </h1>
                    <p className="hidden sm:block text-xs text-slate-600 font-medium">
                        {t('header.subtitle')}
                    </p>
                </div>
            </div>
            
            <div className="hidden sm:flex items-center justify-end gap-3 flex-shrink-0 flex-wrap">
                 {/* HIGH VISIBILITY GUIDE BUTTON */}
                 <button
                    onClick={onOpenInstructions}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-indigo-200 hover:scale-105 transition-all transform active:scale-95 font-bold text-xs uppercase tracking-wide mr-1"
                >
                    <GuideIcon size={18} />
                    {t('header.instructions')}
                </button>

                {/* API KEY CONFIG BUTTON */}
                {onOpenApiKey && (
                    <button
                        onClick={onOpenApiKey}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-all font-bold text-xs shadow-sm hover:scale-105 transform active:scale-95 mr-1"
                        title="Настройка API ключа Gemini"
                    >
                        <span className="text-sm">🔑</span>
                        <span>API Key</span>
                    </button>
                )}

                 <button
                    onClick={handleCopy}
                    className={`ios-btn px-4 py-2 text-sm transition-all ${isCopied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50/50 text-orange-900 border-orange-100'}`}
                    title="Copy Prompt JSON"
                >
                    {isCopied ? <span className="mr-2">✅</span> : <BrainIcon size={16} className="mr-2" />}
                    <span>{isCopied ? t('preview.copied') : t('header.prompt')}</span>
                </button>

                 {isDevMode && (
                    <>
                        
                        <button
                            onClick={onOpenDevForge}
                            className="ios-btn w-10 h-10 p-0 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                            title={t('header.forge')}
                        >
                            <ForgeIcon size={20} />
                        </button>

                        <button
                            onClick={onOpenLicenseGenerator}
                            className="ios-btn w-10 h-10 p-0 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                            title={t('menu.keyGen')}
                        >
                            <span className="text-lg">🔑</span>
                        </button>
                    </>
                 )}

                 {license?.features.allowStickers && (
                     <button
                        onClick={onOpenWizard}
                        className="ios-btn w-10 h-10 p-0 hover:bg-slate-100"
                        title={t('header.wizard')}
                    >
                        <span className="text-lg">🧙‍♂️</span>
                    </button>
                 )}

                 {license?.features.allowPro && (
                     <button
                        onClick={onOpenHistory}
                        className="ios-btn w-10 h-10 p-0 hover:bg-slate-100"
                        title={t('header.history')}
                    >
                        <span className="text-lg">🕰️</span>
                    </button>
                 )}

                 <button
                    onClick={onLogout}
                    className="ios-btn bg-red-50 text-red-600 border-red-100 px-4 py-2 text-sm font-bold hover:bg-red-100 transition-all"
                    title={t('action.logout')}
                >
                    <LogoutIcon size={16} className="mr-2" />
                    <span>{t('action.logout')}</span>
                </button>

                 <button
                    onClick={onOpenPatchNotes}
                    className="ios-btn w-10 h-10 p-0"
                    title={t('header.whatsNew')}
                >
                    <WhatsNewIcon size={20} />
                </button>
                <button
                    onClick={toggleLanguage}
                    className="ios-btn w-12 h-10 p-0 text-xs font-bold"
                >
                    {language === 'ru' ? 'EN' : 'RU'}
                </button>
            </div>

            <div className="flex sm:hidden items-center gap-2">
                <button 
                    onClick={onOpenMobileMenu}
                    className="ios-btn w-10 h-10 p-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
