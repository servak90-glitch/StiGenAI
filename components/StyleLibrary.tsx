
import React, { useState, useMemo } from 'react';
import { StyleKey, InterpretationMode, StyleInfo, StyleCategoryKey } from '../types';
import { STYLE_LIBRARY, ALWAYS_ARTISTIC_STYLES, ARTISTIC_STYLES, STYLE_CATEGORIES_ORDER, REQUIRES_STRICT_STYLES } from '../constants';
import { UserStyle } from '../utils/db';
import { useTranslation } from '../contexts/LanguageContext';

interface StyleLibraryProps {
    selectedStyle: StyleKey;
    onSelectStyle: (style: StyleKey) => void;
    interpretationMode: InterpretationMode;
    onModeChange: (mode: InterpretationMode) => void;
    userStyles?: UserStyle[];
    onDeleteUserStyle?: (id: string) => void;
}

const StyleLibrary: React.FC<StyleLibraryProps> = ({ 
    selectedStyle, onSelectStyle, interpretationMode, onModeChange, userStyles = [], onDeleteUserStyle 
}) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const handleStyleClick = (styleKey: string) => {
        // Restore automatic mode switching logic
        if (ALWAYS_ARTISTIC_STYLES.includes(styleKey as any) || ARTISTIC_STYLES.includes(styleKey as any)) {
            onModeChange('ARTISTIC');
        } else if (REQUIRES_STRICT_STYLES.includes(styleKey as any)) {
            onModeChange('STRICT');
        }
        
        onSelectStyle(styleKey as StyleKey);
    };

    const filteredUserStyles = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return userStyles.filter(s => 
            s.name.toLowerCase().includes(query) || s.emoji.includes(query)
        );
    }, [userStyles, searchTerm]);

    const groupedAndFilteredStyles = useMemo(() => {
        const query = searchTerm.toLowerCase();
        
        const filteredStyles = Object.entries(STYLE_LIBRARY).filter(([_key, style]) => {
            return (
                t(style.nameKey).toLowerCase().includes(query) ||
                style.tagKeys.some(tagKey => t(tagKey).toLowerCase().includes(query)) ||
                t(style.badgeKey).toLowerCase().includes(query) ||
                style.emoji.includes(query)
            );
        });

        if (filteredStyles.length === 0 && filteredUserStyles.length === 0) {
            return null;
        }

        const grouped = filteredStyles.reduce((acc, [key, style]) => {
            const category = style.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push([key as StyleKey, style as StyleInfo]);
            return acc;
        }, {} as Record<StyleCategoryKey, [StyleKey, StyleInfo][]>);
        
        return STYLE_CATEGORIES_ORDER
            .map(categoryName => ({
                categoryName,
                styles: grouped[categoryName] || [],
            }))
            .filter(group => group.styles.length > 0);

    }, [searchTerm, t, filteredUserStyles]);

    const isStrictForced = REQUIRES_STRICT_STYLES.includes(selectedStyle);
    const isArtisticForced = ALWAYS_ARTISTIC_STYLES.includes(selectedStyle as any);

    return (
        <div className="space-y-4">
             {/* Interpretation Mode Toggle */}
             <div className="bg-[#FAFAF8] rounded-xl p-1 border border-[#E8E3DC] flex">
                 <button 
                    onClick={() => !isArtisticForced && onModeChange('STRICT')}
                    disabled={isArtisticForced}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                        interpretationMode === 'STRICT' 
                        ? 'bg-[#A8D5D8] text-[#5A5A5A] shadow-sm' 
                        : isArtisticForced ? 'opacity-50 cursor-not-allowed text-[#8B8B8B]' : 'text-[#8B8B8B] hover:bg-[#E8E3DC]/50'
                    }`}
                >
                    🔒 {t('style.strict')}
                </button>
                <button 
                    onClick={() => !isStrictForced && onModeChange('ARTISTIC')}
                    disabled={isStrictForced}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                        interpretationMode === 'ARTISTIC' 
                        ? 'bg-[#D4C5E8] text-[#5A5A5A] shadow-sm' 
                        : isStrictForced ? 'opacity-50 cursor-not-allowed text-[#8B8B8B]' : 'text-[#8B8B8B] hover:bg-[#E8E3DC]/50'
                    }`}
                >
                    🎨 {t('style.artistic')}
                </button>
            </div>
            
            <div className="relative">
                <input
                    type="text"
                    placeholder={t('style.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E3DC] rounded-xl focus:outline-none focus:border-[#A8D5D8] bg-[#FAFAF8] text-[#5A5A5A]"
                />
            </div>

            {/* MY STYLES SECTION */}
            {filteredUserStyles.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 px-1">{t('style.userStyles')}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {filteredUserStyles.map((style) => (
                            <div key={style.id} className="relative group">
                                <button
                                    onClick={() => handleStyleClick(style.id)}
                                    className={`w-full p-2 border rounded-xl text-left transition-all duration-200 flex flex-col min-h-[80px]
                                    ${selectedStyle === style.id ? 'bg-white border-[#A8D5D8] shadow-md ring-1 ring-[#A8D5D8]/50' : 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-300'}`}
                                >
                                    <div className="text-2xl mb-1 transform transition-transform group-hover:scale-110 origin-left">{style.emoji}</div>
                                    <div className="font-bold text-[10px] text-indigo-900 leading-tight break-words line-clamp-2">{style.name}</div>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteUserStyle?.(style.id); }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {groupedAndFilteredStyles ? groupedAndFilteredStyles.map(({ categoryName, styles }) => (
                <div key={categoryName}>
                    <h3 className="text-[10px] font-bold text-[#8B8B8B] uppercase tracking-wider mb-2 px-1">{t(`category.${categoryName}`)}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {styles.map(([key, style]) => {
                            const isSelected = selectedStyle === key;
                            const requiresArtistic = ALWAYS_ARTISTIC_STYLES.includes(key as any);
                            const requiresStrict = REQUIRES_STRICT_STYLES.includes(key);

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleStyleClick(key)}
                                    className={`relative p-2 border rounded-xl text-left transition-all duration-200 group flex flex-col min-h-[80px]
                                    ${
                                        isSelected
                                            ? 'bg-white border-[#A8D5D8] shadow-md ring-1 ring-[#A8D5D8]/50'
                                            : 'bg-[#FAFAF8] border-[#E8E3DC] hover:border-[#A8D5D8] hover:bg-white'
                                    }`}
                                >
                                    <div className="text-2xl mb-1 transform transition-transform group-hover:scale-110 origin-left">{style.emoji}</div>
                                    <div className="font-bold text-[10px] text-[#5A5A5A] leading-tight line-clamp-2">{t(style.nameKey)}</div>
                                    
                                    {/* Badges */}
                                    <div className="mt-auto pt-1 flex flex-wrap gap-1">
                                        {requiresArtistic && (
                                            <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-rose-700 bg-rose-50 border border-rose-100">
                                                🎨 Art
                                            </div>
                                        )}
                                        {requiresStrict && (
                                            <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-blue-700 bg-blue-50 border border-blue-100">
                                                🔒 Strict
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )) : filteredUserStyles.length === 0 && (
                <div className="text-center py-6 text-[#8B8B8B] text-xs">
                    <p className="font-semibold">{t('style.notFound.title')}</p>
                </div>
            )}
        </div>
    );
};

export default StyleLibrary;
