

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { PromptData, Settings, StickerMode, StickerShape, License, TextMode, StickerType, StyleKey, AspectRatio } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { upscalerService } from '../utils/upscaler';
import { processStickerImage, blobUrlToBase64 } from '../utils/imageProcessor';
import { analyzeStickerOutline } from '../utils/smartTracer';
import { traceOutline, TRACER_PRESETS, TracerPresetKey } from '../utils/svgTracer';
import { saveToHistory, UserStyle } from '../utils/db';
import { useLicenseCredit } from '../utils/licenseManager';
import StyleLibrary from './StyleLibrary';
import ColorPickerControl from './ColorPickerControl';
import ExportModal from './ExportModal';
import MultiCircleLoader from './MultiCircleLoader';
import CosmicToggle from './CosmicToggle';
import SparkleButton from './SparkleButton';

interface ImageGenerationModalNewProps {
    isOpen: boolean;
    onClose: () => void;
    promptData: PromptData;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
    userStyles?: UserStyle[];
    onDeleteUserStyle?: (id: string) => void;
}

const PanelHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <h3 className="text-xs font-bold text-[#8B8B8B] uppercase tracking-widest mb-4 flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        {title}
    </h3>
);

const PastelSelect = ({ options, value, onChange, label, disabled = false }: { options: { value: string, label: string, disabled?: boolean }[], value: string, onChange: (v: string) => void, label?: string, disabled?: boolean }) => (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {label && <label className="text-xs font-bold text-[#8B8B8B] uppercase">{label}</label>}
        <div className="flex bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => !opt.disabled && onChange(opt.value)}
                    disabled={opt.disabled}
                    className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                        value === opt.value 
                        ? 'bg-[#A8D5D8] text-[#5A5A5A] shadow-sm' 
                        : opt.disabled 
                          ? 'text-slate-300 cursor-not-allowed opacity-50' 
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

const LadderSection = ({ active, label, icon, onClick, children }: { active: boolean, label: string, icon: string, onClick: () => void, children?: React.ReactNode }) => (
    <div className="border-b border-[#E8E3DC] last:border-0 bg-[#FEFCFB]">
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 text-left transition-all duration-200 outline-none ${active ? 'bg-white shadow-sm z-10 relative' : 'hover:bg-[#FAFAF8]'}`}
        >
            <div className="flex items-center gap-3">
                <span className="text-xl filter drop-shadow-sm">{icon}</span>
                <span className={`text-sm font-bold tracking-wide uppercase ${active ? 'text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>{label}</span>
            </div>
            <svg className={`w-4 h-4 text-[#8B8B8B] transition-transform duration-300 ${active ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${active ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-white border-t border-[#F5F3F0]">{children}</div>
        </div>
    </div>
);

const ImageGenerationModalNew: React.FC<ImageGenerationModalNewProps> = ({ 
    isOpen, onClose, promptData, onSettingsChange, license, onUsageUpdate, userStyles, onDeleteUserStyle 
}) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<'STYLE' | 'BACKGROUND' | 'TEXT' | 'FILTERS' | 'EFFECTS' | 'STROKE'>('STYLE');
    const [mobileView, setMobileView] = useState<'LEFT' | 'CENTER' | 'RIGHT'>('CENTER');
    const [zoom, setZoom] = useState(1);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [manualSeed, setManualSeed] = useState<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);

    const [doUpscale, setDoUpscale] = useState(false);
    const [removeBackground, setRemoveBackground] = useState(true);
    const [addCutLine, setAddCutLine] = useState(true);
    const [exportFormat, setExportFormat] = useState<'PNG' | 'JPG' | 'SVG'>('PNG');
    const vectorMode: TracerPresetKey = 'BALANCED';
    const refFileInputRef = useRef<HTMLInputElement>(null);
    const resultFileInputRef = useRef<HTMLInputElement>(null);

    const [showPromptText, setShowPromptText] = useState(false);
    const [copyPromptSuccess, setCopyPromptSuccess] = useState(false);

    const handleCopyPrompt = () => {
        if (promptData?.prompt) {
            navigator.clipboard.writeText(promptData.prompt);
            setCopyPromptSuccess(true);
            setTimeout(() => setCopyPromptSuccess(false), 2500);
        }
    };

    const handleResultImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                setGeneratedImage(dataUrl);
                saveToHistory({ 
                    id: Date.now().toString(), 
                    imageData: dataUrl, 
                    prompt: promptData.prompt, 
                    settings: promptData.settings as Settings 
                });
                setStatusMessage(t('backup.imageLoadedSuccess'));
                setTimeout(() => setStatusMessage(''), 3000);
            };
            reader.readAsDataURL(file);
        }
    };

    // Paste listener for clipboard images
    useEffect(() => {
        if (!isOpen) return;
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                                setGeneratedImage(result);
                                saveToHistory({ 
                                    id: Date.now().toString(), 
                                    imageData: result, 
                                    prompt: promptData.prompt, 
                                    settings: promptData.settings as Settings 
                                });
                                setStatusMessage(t('backup.imagePastedSuccess'));
                                setTimeout(() => setStatusMessage(''), 3000);
                            }
                        };
                        reader.readAsDataURL(blob);
                    }
                    break;
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, promptData, t]);

    // Update settings when switching to Full Image mode
    const handleModeChange = (mode: StickerMode) => {
        onSettingsChange('stickerMode', mode);
        if (mode === 'FULL_IMAGE') {
            setRemoveBackground(false);
            setAddCutLine(false);
            onSettingsChange('aspectRatio', '1:1'); // Default to 1:1, user can change
        } else {
            setRemoveBackground(true);
            // Re-enable cutline if not PRO, handled by useEffect below
            onSettingsChange('aspectRatio', '1:1'); 
        }
    };

    // Auto-disable cutline for PRO model or Full Image to avoid double borders
    useEffect(() => {
        if (promptData.settings.modelTier === 'PRO' || promptData.settings.stickerMode === 'FULL_IMAGE') {
            setAddCutLine(false);
        } else {
            setAddCutLine(true);
        }
    }, [promptData.settings.modelTier, promptData.settings.stickerMode]);

    const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setReferenceImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const triggerDownload = (url: string, filename: string, shouldRevoke: boolean = false) => {
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link);
        link.click(); document.body.removeChild(link);
        if (shouldRevoke && url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const processItem = async (imgUrl: string) => {
        let url = imgUrl;
        setIsProcessing(true);
        try {
            if (doUpscale && license?.features.allowUpscale) {
                setStatusMessage("🚀 " + t('upscaler.processing'));
                try { url = await upscalerService.upscale(url); } catch (e) { console.warn(e); }
            }
            
            let aiOutlineConfig = undefined;
            if (addCutLine) {
                setStatusMessage(t('status.silhouetteAnalysis'));
                aiOutlineConfig = await analyzeStickerOutline(url);
            }

            setStatusMessage(t('status.vectorPaths'));
            
            const tolerance = 40;

            url = await processStickerImage(url, { 
                removeBackground: removeBackground, 
                addCutLine: addCutLine, 
                cutLineThickness: doUpscale ? 60 : 20, 
                stickerShape: promptData.settings.stickerShape,
                tolerance: tolerance, 
                hardenEdges: true,
                aiOutlineConfig
            });

            if (exportFormat === 'SVG') {
                setStatusMessage(t('status.finalTrace'));
                const svg = await traceOutline(url, TRACER_PRESETS[vectorMode]);
                return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
            }
            return url;
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const generateImageBase = async (text: string, seed: number, currentRef: string | null) => {
        const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
        const isPro = promptData.settings.modelTier === 'PRO';
        const parts: any[] = [];
        
        if (currentRef) {
            // Ensure input is Base64
            const b64Ref = await blobUrlToBase64(currentRef);
            parts.push({ inlineData: { mimeType: 'image/png', data: b64Ref.split(',')[1] } });
        }
        
        let finalPrompt = text;
        
        //strictly enforce white background for easy removal IF isolation mode
        if (promptData.settings.stickerMode === 'ISOLATION') {
             finalPrompt += `. MARGINS: Leave 15% empty space at borders. BACKGROUND: ABSOLUTE PURE WHITE #FFFFFF. NO SHADOWS, NO GRADIENT. FLAT WHITE.`;
        }

        parts.push({ text: finalPrompt });
        
        // Use aspect ratio from settings if available, default to 1:1
        const ar = (promptData.settings.aspectRatio as any) || "1:1";

        const response = await ai.models.generateContent({
            model: isPro ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview',
            contents: { parts: parts },
            config: { 
                seed, temperature: currentRef ? 0.0 : (isPro ? 0.1 : 0.4),
                imageConfig: { aspectRatio: ar }
            }
        });
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error(t('error.noImage'));
    };

    const handleGenerate = async () => {
        if (isGenerating) { abortControllerRef.current?.abort(); setIsGenerating(false); return; }
        if (!license || license.usage.usedGenerations >= license.limits.generations) { setError(t('error.limitReached')); return; }
        if (promptData.settings.modelTier === 'PRO') {
            try { if (!await (window as any).aistudio.hasSelectedApiKey()) await (window as any).aistudio.openSelectKey(); } catch (e) {}
        }
        setIsGenerating(true); setError(null); setMobileView('CENTER'); 
        const controller = new AbortController(); abortControllerRef.current = controller;
        const seedBase = parseInt(manualSeed) || Math.floor(Math.random() * 1000000);
        try {
            if (await useLicenseCredit(license.key)) {
                onUsageUpdate(license.usage.usedGenerations + 1);
                const url = await generateImageBase(promptData.prompt, seedBase, referenceImage);
                // url is base64 from API
                setGeneratedImage(url);
                saveToHistory({ id: Date.now().toString(), imageData: url, prompt: promptData.prompt, settings: promptData.settings as Settings });
            }
        } catch (err: any) {
             if (err.message && err.message.includes("Requested entity was not found.")) {
                setError(t('error.apiKey'));
                await (window as any).aistudio.openSelectKey();
            } else {
                setError(err.message);
            }
        } finally { setIsGenerating(false); }
    };

    const getImagesForExport = () => {
        if (generatedImage) return [generatedImage];
        return [];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#5A5A5A]/20 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} images={getImagesForExport()} />

            <div className="w-full h-full md:h-[90vh] md:max-w-[1500px] md:rounded-3xl bg-[#F5F3F0] shadow-2xl flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white border-b border-[#E8E3DC] flex items-center justify-between px-6 flex-shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-[#A8D5D8] flex items-center justify-center text-lg">✨</div>
                        <h1 className="text-lg font-bold text-[#5A5A5A] tracking-tight">{t('generator.title')}</h1>
                    </div>
                    <div className="md:hidden flex bg-[#FAFAF8] rounded-xl p-1 border border-[#E8E3DC]">
                        <button onClick={() => setMobileView('LEFT')} className={`p-2 rounded-lg ${mobileView === 'LEFT' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>⚙️</button>
                        <button onClick={() => setMobileView('CENTER')} className={`p-2 rounded-lg ${mobileView === 'CENTER' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>👁️</button>
                        <button onClick={() => setMobileView('RIGHT')} className={`p-2 rounded-lg ${mobileView === 'RIGHT' ? 'bg-[#A8D5D8] text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>💾</button>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3F0] text-[#8B8B8B]">✕</button>
                </header>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative h-full">
                    <aside className={`absolute md:relative inset-y-0 left-0 z-20 w-full md:w-[380px] h-full bg-[#FEFCFB] border-r border-[#E8E3DC] flex flex-col transition-transform duration-300 ${mobileView === 'LEFT' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                        <div className="flex-1 overflow-y-auto pastel-scroll min-h-0">
                            <LadderSection label={t('category.style')} icon="🎨" active={activeSection === 'STYLE'} onClick={() => setActiveSection('STYLE')}>
                                <div className="space-y-4">
                                     <PastelSelect label={t('format.stickerType')} value={promptData.settings.stickerType} onChange={(v) => onSettingsChange('stickerType', v as StickerType)} options={[{ value: 'IMAGE', label: t('format.stickerType.image') }, { value: 'TEXT', label: t('format.stickerType.text') }]} />
                                    <StyleLibrary selectedStyle={promptData.settings.style as StyleKey} onSelectStyle={(s) => onSettingsChange('style', s)} interpretationMode={promptData.settings.interpretationMode} onModeChange={(m) => onSettingsChange('interpretationMode', m)} userStyles={userStyles} onDeleteUserStyle={onDeleteUserStyle} />
                                    
                                    {promptData.settings.stickerType === 'IMAGE' && (
                                        <div className="mt-4 pt-4 border-t border-[#E8E3DC] space-y-3 animate-fade-in">
                                             <h4 className="text-[10px] font-bold text-[#8B8B8B] uppercase tracking-widest flex items-center gap-2">
                                                🔒 {t('format.compositionLock')}
                                             </h4>
                                             <CosmicToggle label={t('format.compositionLock.pose')} checked={promptData.settings.poseLock} onChange={(v) => onSettingsChange('poseLock', v)} />
                                             <CosmicToggle label={t('format.compositionLock.camera')} checked={promptData.settings.cameraLock} onChange={(v) => onSettingsChange('cameraLock', v)} />
                                             <CosmicToggle label={t('quality.detailPreservation.lock')} checked={promptData.settings.detailLock} onChange={(v) => onSettingsChange('detailLock', v)} />
                                        </div>
                                    )}
                                </div>
                            </LadderSection>

                            <LadderSection label={t('category.background')} icon="🖼️" active={activeSection === 'BACKGROUND'} onClick={() => setActiveSection('BACKGROUND')}>
                                <div className="space-y-6">
                                    <PastelSelect 
                                        label={t('label.mode')} 
                                        value={promptData.settings.stickerMode} 
                                        onChange={(v) => handleModeChange(v as StickerMode)} 
                                        options={[
                                            { value: 'ISOLATION', label: t('option.isolation') }, 
                                            { value: 'CONTAINER', label: t('option.container') },
                                            { value: 'FULL_IMAGE', label: t('format.stickerMode.fullImage') }
                                        ]} 
                                    />
                                    
                                    {promptData.settings.stickerMode === 'FULL_IMAGE' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <PastelSelect 
                                                label={t('advanced.aspectRatio')}
                                                value={promptData.settings.aspectRatio} 
                                                onChange={(v) => onSettingsChange('aspectRatio', v as AspectRatio)}
                                                options={[
                                                    { value: '1:1', label: '1:1' },
                                                    { value: '4:3', label: '4:3' },
                                                    { value: '3:4', label: '3:4' },
                                                    { value: '16:9', label: '16:9' },
                                                    { value: '9:16', label: '9:16' }
                                                ]}
                                            />
                                        </div>
                                    )}

                                    {promptData.settings.stickerMode === 'CONTAINER' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <PastelSelect label={t('label.shape')} value={promptData.settings.stickerShape} onChange={(v) => onSettingsChange('stickerShape', v as StickerShape)} options={[{ value: 'CIRCLE', label: t('option.circle') }, { value: 'SQUARE', label: t('option.square') }, { value: 'TRIANGLE', label: t('option.triangle') }, { value: 'OCTAHEDRON', label: t('format.containerShape.octahedron') }]} />
                                            <CosmicToggle label={t('background.styleBackground')} checked={promptData.settings.styleBackground} onChange={(v) => onSettingsChange('styleBackground', v)} />
                                        </div>
                                    )}
                                </div>
                            </LadderSection>

                            <LadderSection label={t('category.text')} icon="📝" active={activeSection === 'TEXT'} onClick={() => setActiveSection('TEXT')}>
                                <div className="space-y-4">
                                     <PastelSelect label={t('label.mode')} value={promptData.settings.textMode} onChange={(v) => onSettingsChange('textMode', v as TextMode)} options={[{ value: 'NO_TEXT', label: t('text.mode.noText') }, { value: 'CUSTOM_TEXT', label: t('text.mode.customText') }]} />
                                    {(promptData.settings.textMode === 'CUSTOM_TEXT' || promptData.settings.stickerType === 'TEXT') && (
                                        <div className="space-y-4 animate-fade-in">
                                             <input type="text" value={promptData.settings.customText} onChange={(e) => onSettingsChange('customText', e.target.value)} placeholder={t('text.placeholder')} className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-[#5A5A5A] text-sm" />
                                             <ColorPickerControl color={promptData.settings.textColor} onChange={(c) => onSettingsChange('textColor', c)} />
                                        </div>
                                    )}
                                </div>
                            </LadderSection>

                            <LadderSection label={t('panel.filters')} icon="🎭" active={activeSection === 'FILTERS'} onClick={() => setActiveSection('FILTERS')}>
                                <div className="space-y-6">
                                    <PastelSlider label={t('vfx.colorVibrance')} min={0} max={100} value={promptData.settings.colorVibrance} onChange={(v) => onSettingsChange('colorVibrance', v)} displayValue={`${promptData.settings.colorVibrance}%`} />
                                </div>
                            </LadderSection>

                            <LadderSection label={t('category.vfx')} icon="✨" active={activeSection === 'EFFECTS'} onClick={() => setActiveSection('EFFECTS')}>
                                <div className="space-y-6">
                                    <PastelSelect label={t('vfx.materialTexture')} value={promptData.settings.materialTexture} onChange={(v) => onSettingsChange('materialTexture', v as any)} options={[{ value: 'STANDARD', label: t('vfx.material.standard') }, { value: 'WET', label: t('vfx.material.wet') }, { value: 'GLOSSY', label: t('vfx.material.glossy') }, { value: 'METALLIC', label: t('vfx.material.metallic') }, { value: 'GLASS', label: t('vfx.material.glass') }]} />
                                    <PastelSelect label={t('vfx.lighting')} value={promptData.settings.lightingPreset} onChange={(v) => onSettingsChange('lightingPreset', v as any)} options={[{ value: 'STANDARD', label: t('vfx.lighting.standard') }, { value: 'RIM_LIGHT', label: t('vfx.lighting.rim') }, { value: 'STUDIO', label: t('vfx.lighting.studio') }, { value: 'DRAMATIC', label: t('vfx.lighting.dramatic') }, { value: 'CINEMATIC', label: t('vfx.lighting.cinematic') }]} />
                                    <CosmicToggle label={t('vfx.sss.label')} checked={promptData.settings.subsurfaceScattering} onChange={(v) => onSettingsChange('subsurfaceScattering', v)} />
                                    <PastelSelect label={t('vfx.particleEffects')} value={promptData.settings.particleEffects} onChange={(v) => onSettingsChange('particleEffects', v as any)} options={[{ value: 'NONE', label: t('vfx.particles.none') }, { value: 'DROPLEETS', label: t('vfx.particles.droplets') }, { value: 'MIST', label: t('vfx.particles.mist') }, { value: 'SPARKLES', label: t('vfx.particles.sparkles') }, { value: 'GLOW', label: t('vfx.particles.glow') }]} />
                                </div>
                            </LadderSection>

                            <LadderSection label={t('panel.lineWork')} icon="✒️" active={activeSection === 'STROKE'} onClick={() => setActiveSection('STROKE')}>
                                <div className="space-y-6">
                                    <CosmicToggle label={t('label.vectorLook')} checked={promptData.settings.vector === 'YES'} onChange={(v) => onSettingsChange('vector', v ? 'YES' : 'NO')} />
                                    <CosmicToggle label={t('label.outlineOnly')} checked={promptData.settings.outlineOnly === 'YES'} onChange={(v) => onSettingsChange('outlineOnly', v ? 'YES' : 'NO')} />
                                    <PastelSelect label={t('label.lineWeight')} value={promptData.settings.outlineWeight} onChange={(v) => onSettingsChange('outlineWeight', v as any)} options={[{ value: 'THIN', label: t('option.thin') }, { value: 'MEDIUM', label: t('option.medium') }, { value: 'THICK', label: t('option.thick') }]} />
                                </div>
                            </LadderSection>
                        </div>
                    </aside>

                    <main className="flex-1 h-full min-w-0 bg-[#F5F3F0] relative overflow-hidden flex flex-col">
                        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-auto custom-scrollbar">
                            <div className="relative bg-[#FAFAF8] rounded-2xl shadow-sm border border-[#E8E3DC]" style={{ 
                                width: `${512 * zoom}px`, 
                                height: `${512 * (promptData.settings.aspectRatio === '16:9' ? 9/16 : promptData.settings.aspectRatio === '9:16' ? 16/9 : promptData.settings.aspectRatio === '4:3' ? 3/4 : promptData.settings.aspectRatio === '3:4' ? 4/3 : 1) * zoom}px`, 
                                minWidth: '256px', 
                                minHeight: '144px',
                                transition: 'all 0.3s ease'
                            }}>
                                {generatedImage ? (
                                    <img src={generatedImage} className="w-full h-full object-contain p-4" alt="Generated" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B8B8B] p-6 text-center max-w-sm mx-auto space-y-3">
                                        <div className="text-5xl opacity-20">🎨</div>
                                        <p className="font-bold text-sm text-[#5A5A5A]">{t('state.emptyCanvas')}</p>
                                        <p className="text-xs text-[#8B8B8B] leading-relaxed">
                                            {t('backup.subtitle')}
                                        </p>
                                        <div className="flex flex-col gap-2 w-full pt-1">
                                            <button 
                                                onClick={handleCopyPrompt}
                                                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                                    copyPromptSuccess 
                                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                                    : 'bg-[#A8D5D8] hover:bg-[#97c6c9] text-[#5A5A5A]'
                                                }`}
                                            >
                                                📋 {copyPromptSuccess ? t('backup.promptCopied') : t('backup.copyPrompt')}
                                            </button>
                                            <button 
                                                onClick={() => resultFileInputRef.current?.click()}
                                                className="w-full py-2.5 px-3 bg-white hover:bg-[#F5F3F0] text-[#5A5A5A] border border-[#E8E3DC] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                📥 {t('backup.uploadResult')}
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-[#8B8B8B] italic">
                                            {t('backup.pasteNotice')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="absolute bottom-6 right-6 flex gap-2">
                                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-10 h-10 bg-white rounded-full shadow-lg border border-[#E8E3DC] flex items-center justify-center text-[#5A5A5A] hover:text-[#A8D5D8] transition-colors">-</button>
                                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-10 h-10 bg-white rounded-full shadow-lg border border-[#E8E3DC] flex items-center justify-center text-[#5A5A5A] hover:text-[#A8D5D8] transition-colors">+</button>
                            </div>
                        </div>

                        {(isProcessing || isGenerating) && (
                            <div className="absolute inset-0 bg-[#F5F3F0]/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                                <MultiCircleLoader />
                                <p className="font-black text-xs text-[#5A5A5A] uppercase tracking-widest animate-pulse">{statusMessage || t('generator.processing')}</p>
                            </div>
                        )}
                    </main>

                    <aside className={`absolute md:relative inset-y-0 right-0 z-20 w-full md:w-[320px] h-full bg-[#FEFCFB] border-l border-[#E8E3DC] flex flex-col transition-transform duration-300 ${mobileView === 'RIGHT' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pastel-scroll min-h-0">
                            
                            <SparkleButton 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                isProcessing={isGenerating}
                            >
                                {isGenerating ? t('generator.stop') : t('generator.button')}
                            </SparkleButton>

                            {/* --- FREE / BACKUP MODE SECTION --- */}
                            <div className="p-4 bg-[#FAFAF8] border border-[#E8E3DC] rounded-2xl space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#5A5A5A] uppercase tracking-wider flex items-center gap-1.5">
                                        💡 {t('backup.title')}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPromptText(!showPromptText)}
                                        className="text-[11px] font-semibold text-[#8B8B8B] hover:text-[#5A5A5A] underline"
                                    >
                                        {showPromptText ? t('backup.hidePrompt') : t('backup.togglePrompt')}
                                    </button>
                                </div>

                                <p className="text-[11px] text-[#8B8B8B] leading-relaxed">
                                    {t('backup.subtitle')}
                                </p>

                                <div className="flex flex-col gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleCopyPrompt}
                                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            copyPromptSuccess 
                                            ? 'bg-emerald-500 text-white shadow-sm' 
                                            : 'bg-[#A8D5D8] hover:bg-[#97c6c9] text-[#5A5A5A]'
                                        }`}
                                    >
                                        <span>📋</span>
                                        <span>{copyPromptSuccess ? t('backup.promptCopied') : t('backup.copyPrompt')}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => resultFileInputRef.current?.click()}
                                        className="w-full py-2.5 px-3 bg-white hover:bg-[#F5F3F0] text-[#5A5A5A] border border-[#E8E3DC] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                    >
                                        <span>📥</span>
                                        <span>{t('backup.uploadResult')}</span>
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={resultFileInputRef} 
                                        onChange={handleResultImageUpload} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                </div>

                                <div className="text-[10px] text-[#8B8B8B] bg-white p-2 rounded-lg border border-[#E8E3DC]/60 italic text-center">
                                    {t('backup.pasteNotice')}
                                </div>

                                {showPromptText && (
                                    <div className="space-y-1.5 pt-2 border-t border-[#E8E3DC] animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-[#8B8B8B] uppercase">Скомпонованный Промпт:</label>
                                            <button 
                                                type="button" 
                                                onClick={handleCopyPrompt}
                                                className="text-[10px] text-[#A8D5D8] font-bold hover:underline"
                                            >
                                                Скопировать
                                            </button>
                                        </div>
                                        <textarea 
                                            readOnly 
                                            value={promptData?.prompt || ''} 
                                            className="w-full h-36 p-2 bg-white border border-[#E8E3DC] rounded-xl text-[11px] font-mono text-slate-700 resize-none focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <hr className="border-[#E8E3DC]" />
                            <section className="space-y-4">
                                <PanelHeader title={t('panel.configuration')} icon="⚙️" />
                                <PastelSelect label={t('label.model')} value={promptData.settings.modelTier} onChange={(v) => onSettingsChange('modelTier', v as any)} options={[{ value: 'FAST', label: t('option.fast') }, { value: 'PRO', label: t('option.pro'), disabled: !license?.features.allowPro }]} />
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#8B8B8B] uppercase tracking-wider">{t('label.seed')}</label>
                                    <input 
                                        type="text" 
                                        value={manualSeed} 
                                        onChange={(e) => setManualSeed(e.target.value)} 
                                        placeholder={t('placeholder.random')} 
                                        className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-[#5A5A5A] text-sm focus:outline-none focus:border-[#A8D5D8] transition-colors"
                                    />
                                </div>

                                <div onClick={() => refFileInputRef.current?.click()} className={`relative h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${referenceImage ? 'border-[#A8D5D8] bg-[#FAFAF8]' : 'border-[#E8E3DC]'}`}>
                                    {referenceImage ? <img src={referenceImage} className="h-full object-cover opacity-60" alt="Ref" /> : <span className="text-[10px] font-bold text-[#8B8B8B] uppercase">{t('action.clickToUpload')}</span>}
                                    <input type="file" ref={refFileInputRef} onChange={handleRefImageUpload} accept="image/*" className="hidden" />
                                </div>
                            </section>
                            <hr className="border-[#E8E3DC]" />
                            <section className="space-y-4">
                                <PanelHeader title={t('panel.export')} icon="💾" />
                                <PastelSelect label={t('label.format')} value={exportFormat} onChange={(v) => setExportFormat(v as any)} options={[{ value: 'PNG', label: 'PNG' }, { value: 'JPG', label: 'JPG' }, { value: 'SVG', label: 'SVG', disabled: !license?.features.allowVector }]} />
                                <div className="space-y-2">
                                    <CosmicToggle label={t('label.upscale')} checked={doUpscale} onChange={setDoUpscale} disabled={!license?.features.allowUpscale} />
                                    <CosmicToggle label={t('label.transparentBg')} checked={removeBackground} onChange={v => setRemoveBackground(v)} />
                                    <CosmicToggle label={t('label.cutLine')} checked={addCutLine} onChange={v => setAddCutLine(v)} />
                                </div>
                            </section>
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}
                            {generatedImage && (
                                <div className="flex flex-col gap-2 pt-2">
                                    <button onClick={async () => triggerDownload(await processItem(generatedImage), `sticker-${Date.now()}.png`)} disabled={isProcessing} className="w-full py-3 rounded-xl bg-[#D4C5E8] hover:bg-[#C9BBDE] text-[#5A5A5A] font-bold text-sm flex items-center justify-center gap-2">
                                        {isProcessing ? <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div> : '⬇️'}
                                        {t('action.downloadResult')}
                                    </button>
                                    <button onClick={() => setIsExportModalOpen(true)} className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                        🚀 {t('export.action.share')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerationModalNew;
