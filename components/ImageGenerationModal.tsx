
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { PromptData, Settings, StickerMode, StickerShape } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { upscalerService } from '../utils/upscaler';
import { processStickerImage } from '../utils/imageProcessor';
import { traceOutline, TRACER_PRESETS, TracerPresetKey } from '../utils/svgTracer';
import { saveToHistory } from '../utils/db';
import JSZip from 'jszip';
import SparkleButton from './SparkleButton';

// --- Types ---

interface BatchItem {
    id: string;
    emotion: string;
    status: 'waiting' | 'generating' | 'done' | 'error';
    imageUrl?: string;
    error?: string;
}

interface ImageGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptData: PromptData;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

// --- Pastel Design System Components ---

const PanelHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <h3 className="text-xs font-bold text-[#8B8B8B] uppercase tracking-widest mb-4 flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {title}
    </h3>
);

const PastelToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] border border-[#E8E3DC] cursor-pointer hover:border-[#A8D5D8] transition-all group">
        <span className="text-sm font-medium text-[#5A5A5A] group-hover:text-[#4A4A4A] transition-colors">{label}</span>
        <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-[#A8D5D8]' : 'bg-[#E8E3DC]'}`}>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        </div>
    </label>
);

const PastelSelect = ({ options, value, onChange, label }: { options: { value: string, label: string }[], value: string, onChange: (v: string) => void, label?: string }) => (
    <div className="space-y-2">
        {label && <label className="text-xs font-bold text-[#8B8B8B] uppercase">{label}</label>}
        <div className="flex bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl p-1 gap-1">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        value === opt.value 
                        ? 'bg-[#A8D5D8] text-[#5A5A5A] shadow-sm' 
                        : 'text-[#8B8B8B] hover:bg-[#E8E3DC]/50'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const PastelSlider = ({ value, min, max, onChange, label, displayValue }: { value: number, min: number, max: number, onChange: (v: number) => void, label: string, displayValue?: string }) => (
    <div className="space-y-2 p-3 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-[#5A5A5A]">{label}</span>
            <span className="text-xs font-bold text-[#A8D5D8] bg-[#F5F3F0] px-2 py-0.5 rounded-md">
                {displayValue || value}
            </span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#E8E3DC] rounded-full appearance-none cursor-pointer accent-[#A8D5D8]"
        />
    </div>
);

const TabButton = ({ active, label, onClick, icon }: { active: boolean, label: string, onClick: () => void, icon: string }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 flex-shrink-0 ${
            active 
            ? 'border-[#A8D5D8] text-[#5A5A5A] bg-[#F5F3F0]' 
            : 'border-transparent text-[#8B8B8B] hover:text-[#5A5A5A] hover:bg-[#FAFAF8]'
        }`}
    >
        <span>{icon}</span>
        {label}
    </button>
);

// --- Main Component ---

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, promptData, onSettingsChange }) => {
    const { t } = useTranslation();
    
    // --- State ---
    
    // UI State
    const [leftPanelTab, setLeftPanelTab] = useState<'BACKGROUND' | 'FILTERS' | 'EFFECTS' | 'STROKE'>('BACKGROUND');
    const [mobileView, setMobileView] = useState<'LEFT' | 'CENTER' | 'RIGHT'>('CENTER');
    const [zoom, setZoom] = useState(1);

    // Generation State
    const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [emotionsInput, setEmotionsInput] = useState("Happy, Sad, Angry, Surprised, Cool, Thinking");
    const [manualSeed, setManualSeed] = useState<string>('');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    
    // Process State
    const [isGenerating, setIsGenerating] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Export Options
    const [doUpscale, setDoUpscale] = useState(false);
    const [removeBackground, setRemoveBackground] = useState(true);
    const [addCutLine, setAddCutLine] = useState(true);
    const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
    const [vectorMode, setVectorMode] = useState<TracerPresetKey>('BALANCED');

    // Refs
    const refFileInputRef = useRef<HTMLInputElement>(null);

    // --- Helpers ---

    const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerDownload = (url: string, filename: string, shouldRevoke: boolean = false) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (shouldRevoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const processItem = async (imgUrl: string) => {
        let url = imgUrl;
        if (doUpscale) {
            try {
                url = await upscalerService.upscale(url);
            } catch (e) {
                console.warn("Upscale failed for item, using original", e);
            }
        }
        if (removeBackground || addCutLine) {
            url = await processStickerImage(url, { 
                removeBackground: true, 
                addCutLine, 
                cutLineThickness: doUpscale ? 60 : 20, 
                stickerShape: promptData.settings.stickerShape 
            });
        }
        if (exportFormat === 'SVG') {
            const svg = await traceOutline(url, TRACER_PRESETS[vectorMode]);
            return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        }
        return url;
    };

    // --- Generation Logic ---

    const generateImageBase = async (text: string, seed: number, currentRef: string | null) => {
        const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
        const isPro = promptData.settings.modelTier === 'PRO';
        
        const parts = currentRef ? [
            { inlineData: { mimeType: 'image/png', data: currentRef.split(',')[1] } },
            { text: `${text}. Character Consistency: Mandatory. Strictly maintain 1:1 match for facial features, hair style, outfit components, colors, and artistic style from the reference image. Change only the expression/pose to match the request.` }
        ] : [{ text }];
        
        const response = await ai.models.generateContent({
            model: isPro ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview',
            contents: { parts },
            config: { 
                seed, 
                temperature: currentRef ? 0.0 : (isPro ? 0.1 : 0.4) 
            }
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!part || !part.inlineData) throw new Error("No image data returned from AI");
        return `data:image/png;base64,${part.inlineData.data}`;
    };

    const handleGenerate = async () => {
        if (isGenerating) { 
            abortControllerRef.current?.abort(); 
            setIsGenerating(false); 
            return; 
        }

        if (promptData.settings.modelTier === 'PRO') {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    await (window as any).aistudio.openSelectKey();
                }
            } catch (e) {
                console.error("API Key prompt error", e);
            }
        }

        setIsGenerating(true); 
        setError(null); 
        setProgress(0);
        setMobileView('CENTER'); // Switch to preview on mobile
        
        const controller = new AbortController(); 
        abortControllerRef.current = controller;
        const seedBase = parseInt(manualSeed) || Math.floor(Math.random() * 1000000);

        try {
            if (mode === 'SINGLE') {
                const url = await generateImageBase(promptData.prompt, seedBase, referenceImage);
                setGeneratedImage(url);
                // Fix: Cast settings to Settings since this modal is for stickers
                saveToHistory({ id: Date.now().toString(), imageData: url, prompt: promptData.prompt, settings: promptData.settings as Settings });
            } else {
                // FIXED: Changed splitting logic to avoid splitting complex prompts with internal commas
                const emotions = emotionsInput.split(/\r?\n|;/).map(s => s.trim()).filter(Boolean).slice(0, 15);
                setBatchItems(emotions.map((e, i) => ({ id: `${Date.now()}-${i}`, emotion: e, status: 'waiting' })));
                
                let characterRef = referenceImage;

                for (let i = 0; i < emotions.length; i++) {
                    if (controller.signal.aborted) break;
                    setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'generating' } : it));
                    
                    try {
                        const currentPrompt = i === 0 
                            ? promptData.prompt 
                            : `${promptData.prompt} with ${emotions[i]} expression`;
                        
                        const url = await generateImageBase(currentPrompt, seedBase + i, characterRef);
                        
                        if (i === 0 && !characterRef) {
                            characterRef = url; // Use first generation as reference for consistency
                        }

                        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done', imageUrl: url } : it));
                        // Fix: Cast settings to Settings since this modal is for stickers
                        saveToHistory({ id: `${Date.now()}-${i}`, imageData: url, prompt: `${emotions[i]}: ${promptData.prompt}`, settings: promptData.settings as Settings });
                    } catch (e: any) {
                        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: e.message } : it));
                    }
                    setProgress(((i + 1) / emotions.length) * 100);
                    await new Promise(r => setTimeout(r, 100)); 
                }
            }
        } catch (err: any) { 
            if (err.message && err.message.includes("Requested entity was not found.")) {
                setError("Pro tier requires a paid API key. Please select one.");
                await (window as any).aistudio.openSelectKey();
            } else {
                setError(err.message); 
            }
        } finally { setIsGenerating(false); }
    };

    const handleDownloadPack = async () => {
        const itemsToZip = batchItems.filter(item => item.status === 'done' && item.imageUrl);
        if (itemsToZip.length === 0) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder("sticker-pack");
            
            for (let i = 0; i < itemsToZip.length; i++) {
                const item = itemsToZip[i];
                const processed = await processItem(item.imageUrl!);
                
                const response = await fetch(processed);
                const arrayBuffer = await response.arrayBuffer();
                
                const ext = exportFormat.toLowerCase();
                folder?.file(`${i + 1}-${item.emotion}.${ext}`, arrayBuffer);
                
                if (processed.startsWith('blob:')) {
                    URL.revokeObjectURL(processed);
                }
            }
            
            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);
            triggerDownload(zipUrl, `sticker-pack-${Date.now()}.zip`, true);
        } catch (e) {
            console.error("ZIP Error", e);
            setError("Failed to create ZIP archive.");
        } finally {
            setIsZipping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5A5A5A]/20 backdrop-blur-sm transition-all duration-300">
            <div className="w-full h-full md:h-[90vh] md:max-w-[1500px] md:rounded-3xl bg-[#F5F3F0] shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <header className="h-16 bg-[#FEFCFB] border-b border-[#E8E3DC] flex items-center justify-between px-6 flex-shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#A8D5D8] flex items-center justify-center text-lg">✨</div>
                        <h1 className="text-lg font-bold text-[#5A5A5A] tracking-tight">{t('generator.title')}</h1>
                    </div>
                    
                    {/* Mobile View Switcher */}
                    <div className="md:hidden flex bg-[#FAFAF8] rounded-xl p-1 border border-[#E8E3DC]">
                        <button onClick={() => setMobileView('LEFT')} className={`p-2 rounded-lg ${mobileView === 'LEFT' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </button>
                        <button onClick={() => setMobileView('CENTER')} className={`p-2 rounded-lg ${mobileView === 'CENTER' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => setMobileView('RIGHT')} className={`p-2 rounded-lg ${mobileView === 'RIGHT' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3F0] text-[#8B8B8B] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex flex-1 overflow-hidden relative">
                    
                    {/* LEFT PANEL: Styles & Effects */}
                    <aside className={`
                        absolute md:relative inset-0 md:inset-auto z-20 md:z-0
                        w-full md:w-[320px] bg-[#FEFCFB] border-r border-[#E8E3DC] flex flex-col transition-transform duration-300
                        ${mobileView === 'LEFT' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        {/* Tabs */}
                        <div className="flex border-b border-[#E8E3DC] overflow-x-auto no-scrollbar">
                            <TabButton active={leftPanelTab === 'BACKGROUND'} onClick={() => setLeftPanelTab('BACKGROUND')} label={t('category.background')} icon="🖼️" />
                            <TabButton active={leftPanelTab === 'FILTERS'} onClick={() => setLeftPanelTab('FILTERS')} label="Filters" icon="🎨" />
                            <TabButton active={leftPanelTab === 'EFFECTS'} onClick={() => setLeftPanelTab('EFFECTS')} label={t('category.vfx')} icon="✨" />
                            <TabButton active={leftPanelTab === 'STROKE'} onClick={() => setLeftPanelTab('STROKE')} label="Stroke" icon="✒️" />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 pastel-scroll">
                            {leftPanelTab === 'BACKGROUND' && (
                                <div className="space-y-6 animate-fade-in">
                                    <PanelHeader title={t('format.stickerMode')} icon="📐" />
                                    <PastelSelect 
                                        label="Mode"
                                        value={promptData.settings.stickerMode}
                                        onChange={(v) => onSettingsChange('stickerMode', v as StickerMode)}
                                        options={[
                                            { value: 'ISOLATION', label: 'Isolation' },
                                            { value: 'CONTAINER', label: 'Container' }
                                        ]}
                                    />
                                    
                                    {promptData.settings.stickerMode === 'CONTAINER' && (
                                        <>
                                            <PastelSelect 
                                                label="Shape"
                                                value={promptData.settings.stickerShape}
                                                onChange={(v) => onSettingsChange('stickerShape', v as StickerShape)}
                                                options={[
                                                    { value: 'CIRCLE', label: 'Circle' },
                                                    { value: 'SQUARE', label: 'Square' },
                                                    { value: 'TRIANGLE', label: 'Triangle' }
                                                ]}
                                            />
                                            <PastelToggle 
                                                label={t('background.styleBackground')} 
                                                checked={promptData.settings.styleBackground}
                                                onChange={(v) => onSettingsChange('styleBackground', v)}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {leftPanelTab === 'FILTERS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <PanelHeader title="Color & Tone" icon="🎨" />
                                    <PastelSlider 
                                        label={t('vfx.colorVibrance')}
                                        min={0} max={100}
                                        value={promptData.settings.colorVibrance}
                                        onChange={(v) => onSettingsChange('colorVibrance', v)}
                                        displayValue={`${promptData.settings.colorVibrance}%`}
                                    />
                                </div>
                            )}

                            {leftPanelTab === 'EFFECTS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <PanelHeader title={t('vfx.title')} icon="✨" />
                                    <PastelSelect 
                                        label={t('vfx.materialTexture')}
                                        value={promptData.settings.materialTexture}
                                        onChange={(v) => onSettingsChange('materialTexture', v as any)}
                                        options={[
                                            { value: 'STANDARD', label: 'Standard' },
                                            { value: 'GLOSSY', label: 'Glossy' },
                                            { value: 'METALLIC', label: 'Metallic' }
                                        ]}
                                    />
                                    <PastelSelect 
                                        label={t('vfx.lighting')}
                                        value={promptData.settings.lightingPreset}
                                        onChange={(v) => onSettingsChange('lightingPreset', v as any)}
                                        options={[
                                            { value: 'STANDARD', label: 'Soft' },
                                            { value: 'CINEMATIC', label: 'Cinema' },
                                            { value: 'DRAMATIC', label: 'Drama' }
                                        ]}
                                    />
                                    <PastelToggle 
                                        label={t('vfx.sss.label')} 
                                        checked={promptData.settings.subsurfaceScattering}
                                        onChange={(v) => onSettingsChange('subsurfaceScattering', v)}
                                    />
                                </div>
                            )}

                            {leftPanelTab === 'STROKE' && (
                                <div className="space-y-6 animate-fade-in">
                                    <PanelHeader title="Line Work" icon="✒️" />
                                    <PastelToggle 
                                        label="Vector Look" 
                                        checked={promptData.settings.vector === 'YES'}
                                        onChange={(v) => onSettingsChange('vector', v ? 'YES' : 'NO')}
                                    />
                                    <PastelToggle 
                                        label="Outline Only" 
                                        checked={promptData.settings.outlineOnly === 'YES'}
                                        onChange={(v) => onSettingsChange('outlineOnly', v ? 'YES' : 'NO')}
                                    />
                                    <PastelSelect 
                                        label="Line Weight"
                                        value={promptData.settings.outlineWeight}
                                        onChange={(v) => onSettingsChange('outlineWeight', v as any)}
                                        options={[
                                            { value: 'THIN', label: 'Thin' },
                                            { value: 'MEDIUM', label: 'Medium' },
                                            { value: 'THICK', label: 'Thick' }
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* CENTER PANEL: Preview Canvas */}
                    <main className="flex-1 bg-[#F5F3F0] relative overflow-hidden flex flex-col">
                        {/* Progress Bar */}
                        {(isGenerating || isZipping) && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#E8E3DC] z-10">
                                <div 
                                    className={`h-full transition-all duration-300 ${isZipping ? 'bg-[#D4C5E8]' : 'bg-[#A8D5D8]'}`} 
                                    style={{ width: `${isZipping ? 100 : progress}%` }} 
                                />
                            </div>
                        )}

                        <div className="flex-1 flex items-center justify-center p-8 relative overflow-auto custom-scrollbar">
                            {/* Canvas Container */}
                            {mode === 'SINGLE' ? (
                                <div 
                                    className="relative bg-[#FAFAF8] rounded-2xl shadow-sm border border-[#E8E3DC] transition-transform duration-200"
                                    style={{ 
                                        width: `${512 * zoom}px`, 
                                        height: `${512 * zoom}px`,
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        aspectRatio: '1/1'
                                    }}
                                >
                                    {generatedImage ? (
                                        <img src={generatedImage} className="w-full h-full object-contain p-4" alt="Generated" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8B8B8B] p-8 text-center">
                                            <div className="text-6xl mb-4 opacity-20">🎨</div>
                                            <p className="font-medium text-sm">Your masterpiece will appear here</p>
                                            {isGenerating && <p className="text-[#A8D5D8] mt-4 animate-pulse text-xs uppercase tracking-widest">{t('generator.processing')}</p>}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start p-4">
                                    {batchItems.map(item => (
                                        <div key={item.id} className="aspect-square bg-[#FAFAF8] rounded-xl border border-[#E8E3DC] relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} className="w-full h-full object-contain p-2" alt={item.emotion} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {item.status === 'generating' ? (
                                                        <div className="w-6 h-6 border-2 border-[#A8D5D8] border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        <span className="text-2xl opacity-20">⏳</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 inset-x-0 bg-[#FEFCFB]/90 backdrop-blur-sm p-2 border-t border-[#E8E3DC]">
                                                <p className="text-[10px] font-bold text-[#5A5A5A] text-center uppercase tracking-wide truncate">{item.emotion}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {batchItems.length === 0 && (
                                        <div className="col-span-full h-64 flex flex-col items-center justify-center text-[#8B8B8B] opacity-50">
                                            <p>{t('generator.batch.empty')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Zoom Controls */}
                            <div className="absolute bottom-6 right-6 flex gap-2">
                                <button 
                                    onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                                    className="w-10 h-10 bg-white rounded-full shadow-lg border border-[#E8E3DC] text-[#5A5A5A] hover:text-[#A8D5D8] transition-colors flex items-center justify-center"
                                >
                                    -
                                </button>
                                <div className="px-4 h-10 bg-white rounded-full shadow-lg border border-[#E8E3DC] flex items-center justify-center text-xs font-bold text-[#5A5A5A]">
                                    {Math.round(zoom * 100)}%
                                </div>
                                <button 
                                    onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                                    className="w-10 h-10 bg-white rounded-full shadow-lg border border-[#E8E3DC] text-[#5A5A5A] hover:text-[#A8D5D8] transition-colors flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>

                            {/* Error Toast */}
                            {error && (
                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#E8D4D0] text-[#5A5A5A] px-6 py-3 rounded-full shadow-xl border border-[#E8E3DC] animate-slide-up flex items-center gap-3 z-50">
                                    <span className="text-xl">⚠️</span>
                                    <span className="text-sm font-medium">{error}</span>
                                    <button onClick={() => setError(null)} className="ml-2 hover:text-black">✕</button>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* RIGHT PANEL: Tools & Actions */}
                    <aside className={`
                        absolute md:relative inset-0 md:inset-auto z-20 md:z-0
                        w-full md:w-[320px] bg-[#FEFCFB] border-l border-[#E8E3DC] flex flex-col transition-transform duration-300
                        ${mobileView === 'RIGHT' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    `}>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pastel-scroll">
                            
                            {/* Primary Action Button */}
                            <SparkleButton 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                isProcessing={isGenerating}
                            >
                                {isGenerating ? t('generator.stop') : t('generator.button')}
                            </SparkleButton>

                            <hr className="border-[#E8E3DC]" />

                            {/* Generation Settings */}
                            <section className="space-y-4">
                                <PanelHeader title="Configuration" icon="⚙️" />
                                
                                <PastelSelect 
                                    label="Model"
                                    value={promptData.settings.modelTier}
                                    onChange={(v) => onSettingsChange('modelTier', v as any)}
                                    options={[
                                        { value: 'FAST', label: 'Flash ⚡' },
                                        { value: 'PRO', label: 'Pro ✨' }
                                    ]}
                                />

                                <PastelSelect 
                                    label="Mode"
                                    value={mode}
                                    onChange={(v) => setMode(v as any)}
                                    options={[
                                        { value: 'SINGLE', label: 'Single' },
                                        { value: 'BATCH', label: 'Batch' }
                                    ]}
                                />

                                <div>
                                    <label className="text-xs font-bold text-[#8B8B8B] uppercase mb-2 block">{t('generator.seed.label')}</label>
                                    <input 
                                        type="number"
                                        value={manualSeed}
                                        onChange={e => setManualSeed(e.target.value)}
                                        placeholder="Random"
                                        className="w-full p-3 text-sm bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl focus:outline-none focus:border-[#A8D5D8] text-[#5A5A5A] transition-colors"
                                    />
                                </div>

                                {/* Reference Image */}
                                <div>
                                    <label className="text-xs font-bold text-[#8B8B8B] uppercase mb-2 block">{t('generator.reference.label')}</label>
                                    <div 
                                        onClick={() => refFileInputRef.current?.click()}
                                        className={`
                                            relative h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                                            ${referenceImage ? 'border-[#A8D5D8] bg-[#FAFAF8]' : 'border-[#E8E3DC] hover:border-[#A8D5D8] hover:bg-[#F5F3F0]'}
                                        `}
                                    >
                                        {referenceImage ? (
                                            <>
                                                <img src={referenceImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Ref" />
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[#5A5A5A]"
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-xs font-bold text-[#8B8B8B] pointer-events-none">Click to Upload</span>
                                        )}
                                        <input type="file" ref={refFileInputRef} onChange={handleRefImageUpload} accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                {mode === 'BATCH' && (
                                    <div className="animate-fade-in">
                                        <label className="text-xs font-bold text-[#8B8B8B] uppercase mb-2 block">{t('generator.batch.label')}</label>
                                        <textarea 
                                            value={emotionsInput}
                                            onChange={e => setEmotionsInput(e.target.value)}
                                            className="w-full h-24 p-3 text-xs bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl focus:outline-none focus:border-[#A8D5D8] text-[#5A5A5A] resize-none"
                                            placeholder="Write one emotion per line..."
                                        />
                                    </div>
                                )}
                            </section>

                            <hr className="border-[#E8E3DC]" />

                            {/* Export Settings */}
                            <section className="space-y-4">
                                <PanelHeader title="Export" icon="💾" />
                                
                                <PastelSelect 
                                    label="Format"
                                    value={exportFormat}
                                    onChange={(v) => setExportFormat(v as any)}
                                    options={[
                                        { value: 'PNG', label: 'PNG' },
                                        { value: 'JPG', label: 'JPG' },
                                        { value: 'SVG', label: 'SVG' }
                                    ]}
                                />

                                <div className="space-y-2">
                                    <PastelToggle label="4x AI Upscale" checked={doUpscale} onChange={setDoUpscale} />
                                    <PastelToggle label="Transparent BG" checked={removeBackground} onChange={setRemoveBackground} />
                                    <PastelToggle label="Cut Line" checked={addCutLine} onChange={setAddCutLine} />
                                </div>

                                {exportFormat === 'SVG' && (
                                    <div className="animate-fade-in">
                                        <PastelSelect 
                                            label="Vector Detail"
                                            value={vectorMode}
                                            onChange={(v) => setVectorMode(v as any)}
                                            options={[
                                                { value: 'BALANCED', label: 'Standard' },
                                                { value: 'HIGH_DETAIL', label: 'High' },
                                                { value: 'SMOOTHED', label: 'Smooth' }
                                            ]}
                                        />
                                    </div>
                                )}
                            </section>
                            
                            {/* Download Actions */}
                            {(generatedImage || batchItems.some(i => i.status === 'done')) && (
                                <div className="pt-2 animate-slide-up">
                                    {mode === 'SINGLE' && generatedImage ? (
                                        <button 
                                            onClick={async () => triggerDownload(await processItem(generatedImage), `sticker-${Date.now()}.${exportFormat.toLowerCase()}`)}
                                            className="w-full py-3 rounded-xl bg-[#D4C5E8] hover:bg-[#C9BBDE] text-[#5A5A5A] font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>⬇️</span> Download Result
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleDownloadPack}
                                            disabled={isZipping}
                                            className="w-full py-3 rounded-xl bg-[#D4C5E8] hover:bg-[#C9BBDE] text-[#5A5A5A] font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isZipping ? (
                                                <><span>📦</span> Zipping...</>
                                            ) : (
                                                <><span>📦</span> Download Batch</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>
                    </aside>

                </div>
            </div>
        </div>
    );
};

export default ImageGenerationModal;
