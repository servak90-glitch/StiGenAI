
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { useTranslation } from '../contexts/LanguageContext';
import { CardData, CardStyleKey, License, BrandBundle } from '../types';
import { getBrandAssetPrompts } from '../utils/patternGenerator';
import { upscalerService } from '../utils/upscaler';
import { useLicenseCredit } from '../utils/licenseManager';
import JSZip from 'jszip';
import SparkleButton from './SparkleButton';

interface BrandBundleModalProps {
    isOpen: boolean;
    onClose: () => void;
    brandData: CardData;
    style: CardStyleKey;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
}

const BrandBundleModal: React.FC<BrandBundleModalProps> = ({ isOpen, onClose, brandData, style, license, onUsageUpdate }) => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState('');
    const [bundle, setBundle] = useState<BrandBundle | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const generateAsset = async (ai: any, prompt: string, aspectRatio: string) => {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio } }
        });

        for (const candidate of response.candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Generation failed");
    };

    const handleForgeStyle = async () => {
        if (!license) return;
        setIsGenerating(true); setError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const configs = getBrandAssetPrompts(brandData, style);
            const newBundle: BrandBundle = { 
                logo: null, pattern: null, social: null, banner: null, 
                color: brandData.accentColor, style 
            };

            // 1. Logo
            setStatus(t('harmony.status.logo'));
            if (await useLicenseCredit(license.key)) {
                newBundle.logo = await generateAsset(ai, configs.logo.prompt, configs.logo.aspectRatio);
                onUsageUpdate(license.usage.usedGenerations + 1);
            }

            // 2. Pattern
            setStatus(t('harmony.status.pattern'));
            if (await useLicenseCredit(license.key)) {
                newBundle.pattern = await generateAsset(ai, configs.pattern.prompt, configs.pattern.aspectRatio);
                onUsageUpdate(license.usage.usedGenerations + 1);
            }

            // 3. Social
            setStatus(t('harmony.status.social'));
            if (await useLicenseCredit(license.key)) {
                newBundle.social = await generateAsset(ai, configs.social.prompt, configs.social.aspectRatio);
                onUsageUpdate(license.usage.usedGenerations + 1);
            }

            // 4. Banner
            setStatus(t('harmony.status.banner'));
            if (await useLicenseCredit(license.key)) {
                let b = await generateAsset(ai, configs.banner.prompt, configs.banner.aspectRatio);
                if (license.features.allowUpscale) b = await upscalerService.upscale(b);
                newBundle.banner = b;
                onUsageUpdate(license.usage.usedGenerations + 1);
            }

            setBundle(newBundle);
        } catch (e: any) {
            setError(e.message || "Brand Forge Failed");
        } finally {
            setIsGenerating(false);
            setStatus('');
        }
    };

    const handleDownloadAll = async () => {
        if (!bundle) return;
        const zip = new JSZip();
        const folder = zip.folder("brand-identity-kit");
        if (bundle.logo) folder?.file("logo.png", bundle.logo.split(',')[1], { base64: true });
        if (bundle.pattern) folder?.file("pattern.png", bundle.pattern.split(',')[1], { base64: true });
        if (bundle.social) folder?.file("social-icon.png", bundle.social.split(',')[1], { base64: true });
        if (bundle.banner) folder?.file("banner.png", bundle.banner.split(',')[1], { base64: true });
        
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `brand-bundle-${Date.now()}.zip`;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-[#F5F3F0] w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-white/20">
                <header className="p-8 flex items-center justify-between border-b border-[#E8E3DC] bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter">{t('harmony.title')}</h2>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{t('harmony.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    {bundle ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
                            {/* Logo */}
                            <div className="clean-card p-6 flex flex-col gap-4 group">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('harmony.asset.logo')}</h4>
                                <div className="aspect-square bg-white rounded-3xl border border-slate-100 p-8 shadow-inner group-hover:scale-[1.02] transition-transform">
                                    <img src={bundle.logo!} className="w-full h-full object-contain" alt="Logo" />
                                </div>
                            </div>
                            {/* Pattern */}
                            <div className="clean-card p-6 flex flex-col gap-4 group">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('harmony.asset.pattern')}</h4>
                                <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform" style={{ backgroundImage: `url(${bundle.pattern})`, backgroundSize: '150px' }}>
                                </div>
                            </div>
                            {/* Social */}
                            <div className="clean-card p-6 flex flex-col gap-4 group">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('harmony.asset.social')}</h4>
                                <div className="aspect-square bg-white rounded-full overflow-hidden border-4 border-slate-100 shadow-md flex items-center justify-center p-6 group-hover:scale-[1.02] transition-transform">
                                    <img src={bundle.social!} className="w-full h-full object-cover" alt="Social" />
                                </div>
                            </div>
                            {/* Banner */}
                            <div className="clean-card p-6 col-span-full flex flex-col gap-4 group">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('harmony.asset.banner')}</h4>
                                <div className="aspect-[21/9] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md group-hover:scale-[1.01] transition-transform">
                                    <img src={bundle.banner!} className="w-full h-full object-cover" alt="Banner" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-8 text-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#A8D5D8] to-[#D4C5E8] animate-pulse flex items-center justify-center">
                                    <span className="text-6xl">🎨</span>
                                </div>
                                <div className="absolute -inset-4 rounded-full border-2 border-dashed border-[#A8D5D8] animate-spin-slow"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#5A5A5A] mb-2">{brandData.company}</h3>
                                <p className="text-sm text-slate-400 max-w-sm">{brandData.companyDescription}</p>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-8 bg-white border-t border-[#E8E3DC] flex items-center justify-between">
                    <div className="flex flex-col">
                        {isGenerating && <div className="flex items-center gap-3 text-sky-600 font-black uppercase text-xs animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                            {status}
                        </div>}
                        {error && <span className="text-red-500 text-xs font-bold">⚠️ {error}</span>}
                    </div>

                    <div className="flex gap-4">
                        {bundle && (
                            <button onClick={handleDownloadAll} className="px-10 py-4 rounded-2xl bg-[#D4C5E8] text-[#5A5A5A] font-black uppercase tracking-widest hover:bg-[#C9BBDE] transition-all shadow-xl active:scale-95">
                                📦 {t('card.action.downloadAll')}
                            </button>
                        )}
                        
                        <div className="w-48">
                            <SparkleButton 
                                onClick={handleForgeStyle}
                                disabled={isGenerating}
                                isProcessing={isGenerating}
                            >
                                {t('harmony.action.generate')}
                            </SparkleButton>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BrandBundleModal;
