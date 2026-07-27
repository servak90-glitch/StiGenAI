
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { TelegramIcon, WhatsAppIcon } from './Icons';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[]; // Base64 strings
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, images }) => {
    const { t } = useTranslation();
    const [isSharing, setIsSharing] = useState(false);

    if (!isOpen) return null;

    const base64ToFile = async (base64: string, filename: string): Promise<File> => {
        const res = await fetch(base64);
        const blob = await res.blob();
        return new File([blob], filename, { type: 'image/png' });
    };

    const handleNativeShare = async () => {
        if (!navigator.canShare) {
            alert(t('export.error.unsupported'));
            return;
        }

        setIsSharing(true);
        try {
            const files = await Promise.all(images.map((img, i) => base64ToFile(img, `sticker_${i + 1}.png`)));
            
            const shareData = {
                files: files,
                title: 'StiGenAi Stickers',
                text: 'Created with StiGenAi'
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                alert(t('export.error.unsupported'));
            }
        } catch (error) {
            console.error('Error sharing:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-fade-in border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{t('export.title')}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('export.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
                        ✕
                    </button>
                </header>

                <div className="space-y-6">
                    {/* Preview Strip */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {images.map((src, i) => (
                            <img key={i} src={src} className="w-16 h-16 rounded-xl border border-slate-100 object-contain bg-slate-50" />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={handleNativeShare}
                            disabled={isSharing}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                        >
                            {isSharing ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : '🚀 ' + t('export.action.share')}
                        </button>
                        
                        <div className="flex gap-2 text-[10px] text-slate-400 font-medium justify-center pt-2">
                            <span className="flex items-center gap-1"><TelegramIcon size={12} /> Telegram</span>
                            <span className="flex items-center gap-1"><WhatsAppIcon size={12} /> WhatsApp</span>
                            <span>• {t('export.native.desc')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
