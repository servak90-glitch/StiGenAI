
import React, { useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { upscalerService } from '../utils/upscaler';
import { License } from '../types';
import { useLicenseCredit } from '../utils/licenseManager';
import SparkleButton from './SparkleButton';

interface UpscalerModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
}

const UpscalerModal: React.FC<UpscalerModalProps> = ({ isOpen, onClose, license, onUsageUpdate }) => {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setResultImage(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpscale = async () => {
        if (!selectedImage) return;
        
        if (!license || license.usage.usedGenerations >= license.limits.generations) {
            setError(t('error.limitReached'));
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Лицензионный контроль перед запуском тяжелого процесса
            const deducted = await useLicenseCredit(license.key);
            if (deducted) {
                // Синхронизация UI с новым использованием
                onUsageUpdate(license.usage.usedGenerations + 1);
                
                // Using the existing service which handles tiling and 4x logic
                const upscaledBase64 = await upscalerService.upscale(selectedImage);
                setResultImage(upscaledBase64);
            } else {
                throw new Error("Credit deduction failed");
            }
        } catch (err: any) {
            console.error("Upscale failed:", err);
            setError(t('upscaler.error') + ": " + (err.message || "Unknown error"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `upscaled-photo-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-emerald-600 text-white flex-shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            🚀 {t('upscaler.title')}
                        </h2>
                        <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">{t('upscaler.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-slate-50">
                    
                    {/* Left: Input */}
                    <div className="w-full lg:w-1/2 p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">{t('upscaler.original')}</h3>
                            {selectedImage && (
                                <button 
                                    onClick={() => { setSelectedImage(null); setResultImage(null); }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                    ✕ {t('generator.reference.clear')}
                                </button>
                            )}
                        </div>

                        <div className="flex-grow flex flex-col justify-center min-h-[300px]">
                            {selectedImage ? (
                                <div className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200 group bg-[url('/transparent-bg.png')]">
                                    <img src={selectedImage} alt="Original" className="w-full h-full object-contain max-h-[50vh]" />
                                </div>
                            ) : (
                                <label className="flex-grow flex flex-col items-center justify-center border-3 border-dashed border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-all bg-white p-8">
                                    <span className="text-6xl mb-4">📤</span>
                                    <span className="font-bold text-slate-600 text-lg">{t('upscaler.uploadLabel')}</span>
                                    <span className="text-sm text-slate-400 mt-2">{t('upscaler.placeholder')}</span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload} 
                                    />
                                </label>
                            )}
                        </div>

                        <div className="mt-6">
                             <SparkleButton
                                onClick={handleUpscale}
                                disabled={!selectedImage || isProcessing}
                                isProcessing={isProcessing}
                            >
                                {isProcessing ? t('upscaler.processing') : '✨ ' + t('upscaler.process')}
                            </SparkleButton>

                            {error && (
                                <div className="mt-3 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-3 text-center">{t('upscaler.compareTip')}</p>
                        </div>
                    </div>

                    {/* Right: Output */}
                    <div className="w-full lg:w-1/2 p-6 flex flex-col bg-slate-100 overflow-y-auto relative">
                         <h3 className="font-bold text-slate-700 mb-4">{t('upscaler.result')}</h3>
                         
                         <div className="flex-grow flex items-center justify-center min-h-[300px] relative">
                            {resultImage ? (
                                <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 bg-[url('/transparent-bg.png')] animate-fade-in w-full h-full flex items-center justify-center">
                                    <img src={resultImage} alt="Upscaled" className="max-w-full max-h-[60vh] object-contain" />
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    {isProcessing ? (
                                         <div className="flex flex-col items-center animate-pulse">
                                             <div className="text-6xl mb-4">⚙️</div>
                                             <p>{t('upscaler.processing')}</p>
                                         </div>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-50">
                                            <div className="text-6xl mb-4">🖼️</div>
                                            <p>{t('generator.batch.empty')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>

                         {resultImage && (
                             <div className="mt-6 animate-slide-up">
                                 <button
                                    onClick={handleDownload}
                                    className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                     {t('upscaler.download')}
                                </button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpscalerModal;
