

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface FloatingActionsProps {
    onGenerate: () => void;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ onGenerate }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed bottom-20 right-4 z-40 sm:hidden flex flex-col items-end gap-3 pointer-events-none">
            {/* Generate Button (Banana) */}
             <button
                onClick={onGenerate}
                className="pointer-events-auto w-16 h-16 rounded-full bg-yellow-400 text-slate-900 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none ring-4 ring-yellow-400/30"
                aria-label={t('generator.button')}
            >
                <span className="text-3xl">🍌</span>
            </button>
        </div>
    );
};

export default FloatingActions;