
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface DevLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DevLoginModal: React.FC<DevLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // HARDCODED PASSWORD
        if (password === 'Yaroslav1990!') { 
            onSuccess();
            onClose();
            setPassword('');
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-[#FEFCFB] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#E8E3DC] p-6 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">🕵️‍♂️</div>
                    <h2 className="text-xl font-bold text-[#5A5A5A]">{t('dev.title')}</h2>
                    <p className="text-xs text-[#8B8B8B]">{t('dev.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('dev.placeholder')}
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F3F0] border border-[#E8E3DC] text-[#5A5A5A] focus:outline-none focus:border-[#A8D5D8] text-center tracking-widest placeholder:tracking-normal transition-colors"
                        />
                        {error && (
                            <p className="text-xs text-red-400 text-center mt-2 font-bold animate-pulse">
                                {t('dev.error')}
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 rounded-xl bg-[#5A5A5A] text-[#F5F3F0] font-bold text-sm uppercase tracking-wider hover:bg-[#4A4A4A] transition-colors shadow-lg"
                    >
                        {t('dev.button')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DevLoginModal;
