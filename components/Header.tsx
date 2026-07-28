
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { License } from '../types';
import { BananaIcon } from './Icons';

interface HeaderProps {
    activeModal: string | null;
    onOpenGenerator: () => void;
    onOpenTransposer: () => void;
    onOpenUpscaler: () => void;
    onOpenPack: () => void;
    onOpenProcessor: () => void;
    onOpenSettingsMenu: () => void;
    onLogoClick: () => void;
    license?: License | null;
}

const Header: React.FC<HeaderProps> = ({ 
    activeModal,
    onOpenGenerator,
    onOpenTransposer,
    onOpenUpscaler,
    onOpenPack,
    onOpenProcessor,
    onOpenSettingsMenu,
    onLogoClick,
    license
}) => {
    const { t } = useTranslation();

    const tools = [
        { 
            id: 'generator', 
            label: t('dashboard.start'), 
            icon: '✨', 
            action: onOpenGenerator, 
            allow: license?.features.allowStickers,
            activeClass: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/50',
            inactiveClass: 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm'
        },
        { 
            id: 'transposer', 
            label: t('dashboard.transposer'), 
            icon: '🧬', 
            action: onOpenTransposer, 
            allow: license?.features.allowTransposer,
            activeClass: 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-fuchsia-400/50',
            inactiveClass: 'bg-fuchsia-50/90 text-fuchsia-900 border border-fuchsia-200/80 hover:bg-fuchsia-100 hover:border-fuchsia-300 hover:shadow-sm'
        },
        { 
            id: 'upscaler', 
            label: t('dashboard.upscaler'), 
            icon: '🚀', 
            action: onOpenUpscaler, 
            allow: license?.features.allowUpscale,
            activeClass: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50',
            inactiveClass: 'bg-emerald-50/90 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm'
        },
        { 
            id: 'pack', 
            label: t('dashboard.pack'), 
            icon: '📦', 
            action: onOpenPack, 
            allow: license?.features.allowPack,
            activeClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-amber-400/50',
            inactiveClass: 'bg-amber-50/90 text-amber-900 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm'
        },
        { 
            id: 'processor', 
            label: t('dashboard.vectorize'), 
            icon: '✂️', 
            action: onOpenProcessor, 
            allow: license?.features.allowVector,
            activeClass: 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-400/50',
            inactiveClass: 'bg-sky-50/90 text-sky-900 border border-sky-200/80 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm'
        },
    ];

    return (
        <header className="px-3 py-2.5 sm:px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 z-40 relative shadow-xs">
            {/* LOGO */}
            <div 
                className="text-left flex-shrink-0 flex items-center gap-2.5 cursor-pointer select-none group"
                onClick={onLogoClick}
            >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 flex items-center justify-center shadow-md shadow-orange-500/20 transform group-hover:rotate-6 transition-all duration-300 text-white">
                    <BananaIcon size={22} />
                </div>
                <div className="hidden min-[450px]:block">
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800">{t('header.title')}</span>
                    </h1>
                </div>
            </div>

            {/* TOP TOOL NAVIGATION BUTTONS */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
                {tools.map(tool => {
                    if (tool.allow === false) return null;
                    const isActive = activeModal === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={tool.action}
                            className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 shrink-0 whitespace-nowrap active:scale-95 transform hover:-translate-y-0.5 ${
                                isActive 
                                    ? `${tool.activeClass} scale-105` 
                                    : tool.inactiveClass
                            }`}
                        >
                            <span className="text-sm sm:text-base transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-200">
                                {tool.icon}
                            </span>
                            <span className="hidden lg:inline">{tool.label}</span>
                            <span className="lg:hidden">{tool.label.split(' ')[0]}</span>
                        </button>
                    );
                })}
            </div>

            {/* GEAR MENU BUTTON (⚙️) */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={onOpenSettingsMenu}
                    className={`group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 transform hover:-translate-y-0.5 ${
                        activeModal === 'mobileMenu'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/50'
                            : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                    }`}
                    title="Меню и настройки"
                >
                    <span className="text-base sm:text-lg transform group-hover:rotate-45 transition-transform duration-300">⚙️</span>
                    <span className="hidden sm:inline">{t('menu.title')}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
