
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { useTranslation } from '../contexts/LanguageContext';
import { License } from '../types';
import { useLicenseCredit } from '../utils/licenseManager';
import { upscalerService } from '../utils/upscaler';
import { processStickerImage } from '../utils/imageProcessor';
import { analyzeStickerOutline } from '../utils/smartTracer';
import JSZip from 'jszip';
import SunLoader from './SunLoader';
import SparkleButton from './SparkleButton';

interface DevBatchForgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
    onOpenPrint: (images: string[]) => void;
}

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer hover:border-amber-400 transition-all group">
        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors uppercase">{label}</span>
        <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${checked ? 'bg-amber-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        </div>
    </label>
);

const DevBatchForgeModal: React.FC<DevBatchForgeModalProps> = ({ 
    isOpen, onClose, license, onUsageUpdate, onOpenPrint 
}) => {
    const { t } = useTranslation();
    const [refs, setRefs] = useState<string[]>([]);
    const [masterPrompt, setMasterPrompt] = useState("Professional character design, high detail, vibrant, transparent background style");
    const [results, setResults] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    
    // Export Options
    const [doUpscale, setDoUpscale] = useState(false);
    const [removeBackground, setRemoveBackground] = useState(true);
    const [addCutLine, setAddCutLine] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        const remaining = 20 - refs.length;
        files.slice(0, remaining).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setRefs(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerate = async () => {
        if (!license || isGenerating || refs.length === 0) return;
        
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        } catch(e) { console.error(e); }

        setIsGenerating(true); 
        setProgress(0); 
        setError(null);
        setResults([]); // Clear previous results
        
        try {
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const newResults: string[] = [];
            let aiAnchor: string | null = null; 

            // Loop strictly through the number of references
            for (let i = 0; i < refs.length; i++) {
                if (license.key !== 'ADMIN-ACCESS') {
                    if (!(await useLicenseCredit(license.key))) throw new Error(t('error.limitReached'));
                }
                onUsageUpdate(license.usage.usedGenerations + 1);

                const parts: any[] = [];
                
                // 1. Add current reference image (The Subject/Pose source)
                parts.push({ inlineData: { mimeType: 'image/png', data: refs[i].split(',')[1] } });
                
                // 2. Add Anchor (First result) if available (from 2nd iteration onwards)
                if (i > 0 && aiAnchor) {
                     parts.push({ inlineData: { mimeType: 'image/png', data: aiAnchor.split(',')[1] } });
                     parts.push({ text: "STYLE REFERENCE: The second image provided is the Style Anchor. You MUST strictly replicate its art style, line weight, shading, and color palette. Ignore the subject of the anchor, but copy its visual DNA." });
                }

                // 3. Prompt
                parts.push({ text: `${masterPrompt}. Variant #${i+1}. Transform the FIRST image (Reference) into this new style. Keep the subject/pose from the FIRST image, but apply the style defined in the prompt/anchor.` });

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts },
                    config: { 
                        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
                    }
                });

                let img: string | null = null;
                for (const cand of response.candidates || []) {
                    for (const part of cand.content?.parts || []) {
                        if (part.inlineData) { img = `data:image/png;base64,${part.inlineData.data}`; break; }
                    }
                    if (img) break;
                }
                
                if (img) {
                    newResults.push(img);
                    if (i === 0) aiAnchor = img; // Lock first result as anchor
                    setResults(prev => [...prev, img!]);
                }
                setProgress(((i + 1) / refs.length) * 100);
            }
        } catch (e: any) {
            setError(e.message || t('error.forgeFailed'));
        } finally { setIsGenerating(false); }
    };

    const processImage = async (imgUrl: string) => {
        let url = imgUrl;
        
        // 1. Upscale
        if (doUpscale) {
             setStatusMessage("🚀 " + t('upscaler.processing'));
             try { url = await upscalerService.upscale(url); } catch (e) { console.warn("Upscale error:", e); }
        }

        // 2. AI Outline Analysis (Matching Main Generator)
        let aiOutlineConfig = undefined;
        if (addCutLine) {
             setStatusMessage("👁️ AI Silhouette Analysis...");
             try {
                aiOutlineConfig = await analyzeStickerOutline(url);
             } catch (e) { console.warn("Outline analysis failed", e); }
        }

        // 3. BG & Cutline
        if (removeBackground || addCutLine) {
            setStatusMessage("✂️ Constructing Vector Paths...");
            url = await processStickerImage(url, {
                removeBackground: true, 
                addCutLine: addCutLine,
                cutLineThickness: doUpscale ? 60 : 20, 
                stickerShape: 'NONE', 
                hardenEdges: true,
                tolerance: 55, // Updated to match main generator
                aiOutlineConfig
            });
        }
        
        return url;
    };

    const handleDownloadAll = async () => {
        if (results.length === 0) return;
        setIsProcessing(true);
        setStatusMessage(t('action.zipping'));
        try {
            const zip = new JSZip();
            const folder = zip.folder("forge-output");
            
            for (let i = 0; i < results.length; i++) {
                const processed = await processImage(results[i]);
                folder?.file(`forge-${i+1}.png`, processed.split(',')[1], { base64: true });
            }
            
            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `forge-pack-${Date.now()}.zip`;
            link.click();
        } catch (e) {
            console.error(e);
            setError("Export failed");
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const handlePrint = async () => {
        if (results.length === 0) return;
        setIsProcessing(true);
        setStatusMessage(t('print.status.generating'));
        try {
             // Process all images before sending to print
             const processedImages = [];
             for (const img of results) {
                 processedImages.push(await processImage(img));
             }
             onOpenPrint(processedImages);
        } catch (e) {
            console.error(e);
            setError("Print prep failed");
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-amber-400">
                <header className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white transform -rotate-3">⚒️</div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{t('forge.title')}</h2>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.2em]">{t('forge.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition text-slate-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <aside className="w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <section className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('forge.masterPrompt')}</label>
                            <textarea 
                                value={masterPrompt} 
                                onChange={e => setMasterPrompt(e.target.value)}
                                className="w-full h-24 p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-amber-200 outline-none resize-none transition-all shadow-inner"
                            />
                        </section>

                        <section className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('forge.anchors')} ({refs.length})</label>
                            <div className="grid grid-cols-4 gap-2">
                                {refs.map((r, i) => (
                                    <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm relative group">
                                        <img src={r} className="w-full h-full object-cover" />
                                        <button onClick={() => setRefs(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase">{t('action.deleteShort')}</button>
                                    </div>
                                ))}
                                {refs.length < 20 && (
                                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all bg-white">+</button>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="image/*" className="hidden" />
                        </section>

                        <hr className="border-slate-200" />

                        <section className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('panel.export')}</label>
                            <div className="space-y-2">
                                <Toggle label={t('label.upscale')} checked={doUpscale} onChange={setDoUpscale} />
                                <Toggle label={t('label.transparentBg')} checked={removeBackground} onChange={setRemoveBackground} />
                                <Toggle label={t('label.cutLine')} checked={addCutLine} onChange={setAddCutLine} />
                            </div>
                        </section>

                        <SparkleButton 
                            onClick={handleGenerate} 
                            disabled={isGenerating || refs.length === 0}
                            isProcessing={isGenerating}
                        >
                             {`🚀 ${t('forge.run')}`}
                        </SparkleButton>

                        <div className="mt-auto space-y-2">
                             {results.length > 0 && (
                                <button onClick={handleDownloadAll} disabled={isProcessing} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                     {isProcessing ? <SunLoader className="w-4 h-4" /> : '📦'} 
                                     {t('forge.downloadZip')}
                                </button>
                             )}
                             {results.length > 0 && (
                                <button onClick={handlePrint} disabled={isProcessing} className="w-full py-4 border-2 border-slate-800 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                    {isProcessing ? <SunLoader className="w-4 h-4" /> : '🖨️'}
                                    {t('forge.masterSheet')}
                                </button>
                             )}
                             {(isProcessing || isGenerating) && statusMessage && (
                                 <p className="text-[10px] text-center font-bold text-amber-600 animate-pulse uppercase tracking-wider">{statusMessage}</p>
                             )}
                        </div>
                    </aside>

                    <main className="flex-1 bg-slate-100 p-8 overflow-y-auto custom-scrollbar">
                        {isGenerating && (
                            <div className="mb-8 w-full h-3 bg-white rounded-full overflow-hidden shadow-inner border border-slate-200">
                                <div className="h-full bg-amber-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                        
                        {results.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {results.map((r, i) => (
                                    <div key={i} className="bg-white p-3 rounded-3xl shadow-xl border-4 border-white animate-slide-up hover:scale-105 transition-transform">
                                        <div className="relative">
                                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">#{i+1}</div>
                                            <img src={r} className="w-full h-full object-contain rounded-2xl" alt={`Forge ${i}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-20 select-none">
                                <span className="text-[200px]">⚒️</span>
                                <p className="font-black text-4xl uppercase tracking-[0.5em]">{t('forge.idle')}</p>
                            </div>
                        )}

                        {error && <div className="mt-8 p-6 bg-red-50 text-red-600 rounded-3xl border-2 border-red-200 font-bold animate-pulse">⚠️ ERROR: {error}</div>}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DevBatchForgeModal;
