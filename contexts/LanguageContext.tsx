import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { translations } from '../i18n';

type Language = 'ru' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('ru');

    useEffect(() => {
        try {
            const storedLang = localStorage.getItem('appLanguage') as Language;
            if (storedLang && ['ru', 'en'].includes(storedLang)) {
                setLanguageState(storedLang);
            } else {
                const browserLang = navigator.language.split('-')[0];
                setLanguageState(browserLang === 'ru' ? 'ru' : 'en');
            }
        } catch (error) {
            console.error("Could not access localStorage", error);
            setLanguageState('ru');
        }
    }, []);

    const setLanguage = (lang: Language) => {
        try {
            localStorage.setItem('appLanguage', lang);
        } catch (error) {
            console.error("Could not access localStorage", error);
        }
        setLanguageState(lang);
    };

    const t = useCallback((key: string, replacements: Record<string, string> = {}): string => {
        let translation = translations[key]?.[language] || key;
        
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });

        return translation;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
