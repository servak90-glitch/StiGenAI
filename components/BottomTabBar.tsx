
import React from 'react';
import { Category, StickerType } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface BottomTabBarProps {
    activeCategory: Category;
    onSelectCategory: (category: Category) => void;
    stickerType: StickerType;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeCategory, onSelectCategory, stickerType }) => {
    const { t } = useTranslation();

    const allCategories: { id: Category; nameKey: string; icon: React.ReactNode }[] = [
        { id: 'style', nameKey: 'category.style', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> },
        { id: 'format', nameKey: 'category.format', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m2 2 7.5 7.5"/></svg> },
        { id: 'quality', nameKey: 'category.quality', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        { id: 'advanced', nameKey: 'category.advanced', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg> },
        { id: 'background', nameKey: 'category.background', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg> },
        { id: 'text', nameKey: 'category.text', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg> },
        { id: 'vfx', nameKey: 'category.vfx', icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/><path d="m12 3-1.8 1.8c-.8.8-2 .8-2.8 0L3 0"/><path d="m12 21 1.8-1.8c.8-.8 2 .8 2.8 0L21 24"/><path d="M12 12.5a2.5 2.5 0 0 1 0-5 .5.5 0 0 0 0-1c-1.7 0-3 1.3-3 3s1.3 3 3 3a.5.5 0 0 0 0-1Z"/><path d="M12 12.5a2.5 2.5 0 0 0 0 5 .5.5 0 0 1 0 1c-1.7 0 3-1.3 3-3s-1.3-3-3-3a.5.5 0 0 1 0 1Z"/></svg> },
    ];

    const visibleCategories = stickerType === 'TEXT' 
        ? allCategories.filter(c => c.id !== 'background') 
        : allCategories;

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-30 pointer-events-none flex justify-center">
            <nav className="glass-panel pointer-events-auto rounded-2xl p-2 shadow-2xl flex gap-1 justify-between max-w-full overflow-x-auto no-scrollbar">
                {visibleCategories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={`ios-btn flex flex-col items-center justify-center min-w-[4rem] h-14 transition-all duration-300
                        ${
                            activeCategory === category.id
                                ? '!bg-white !text-sky-600 !shadow-md scale-105'
                                : 'bg-transparent text-slate-500 hover:text-slate-700 !shadow-none'
                        }`}
                    >
                        {category.icon}
                        <span className="text-[9px] font-bold mt-1 text-center leading-tight">{t(category.nameKey)}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default BottomTabBar;
