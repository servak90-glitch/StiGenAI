
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { useTranslation } from '../contexts/LanguageContext';
import { Settings, License, StyleKey } from '../types';
import { usePromptGenerator } from '../hooks/usePromptGenerator';
import { useLicenseCredit } from '../utils/licenseManager';
import { STYLE_LIBRARY, PRO_STICKER_CONTOUR_PROMPT, EMOTION_LIBRARY, NEGATIVE_PROMPTS } from '../constants';
import { processStickerImage, blobUrlToBase64 } from '../utils/imageProcessor';
import { UserStyle } from '../utils/db';
import { saveToHistory } from '../utils/db';
import StyleLibrary from './StyleLibrary';
import ExportModal from './ExportModal';
import JSZip from 'jszip';
import SparkleButton from './SparkleButton';
import CosmicToggle from './CosmicToggle';

interface StickerPackModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
    onOpenPrint: (images: string[]) => void;
    userStyles?: UserStyle[];
    onDeleteUserStyle?: (id: string) => void;
}

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

// New Type for managing selected emotions
interface SelectedEmotion {
    id: string; // Unique ID for keying in list
    key: string; // Key from EMOTION_LIBRARY or 'CUSTOM'
    label: string; // Display name
    prompt: string; // Visual description
    text: string; // Text to display
    showText: boolean; // Text toggle
}

type PackTextPosition = 'BOTTOM' | 'TOP' | 'INTEGRATED';

const StickerPackModal: React.FC<StickerPackModalProps> = ({ 
    isOpen, onClose, settings, onSettingsChange, license, onUsageUpdate, onOpenPrint, userStyles, onDeleteUserStyle 
}) => {
    const { t, language } = useTranslation();
    const [refs, setRefs] = useState<string[]>([]);
    const [anchorImage, setAnchorImage] = useState<string | null>(null); // New state for manual anchor
    
    const [activeSection, setActiveSection] = useState<'STYLE' | 'CONFIG' | 'EMOTIONS'>('EMOTIONS');

    // Updated Emotion State
    const [selectedEmotions, setSelectedEmotions] = useState<SelectedEmotion[]>([]);
    const [textLang, setTextLang] = useState<'RU' | 'EN'>('RU');
    const [customEmotionInput, setCustomEmotionInput] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [textPosition, setTextPosition] = useState<PackTextPosition>('BOTTOM');
    const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

    const [results, setResults] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    // Preview Modal State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewZoom, setPreviewZoom] = useState(1);
    
    // Mobile View State
    const [mobileTab, setMobileTab] = useState<'CONFIG' | 'RESULTS'>('CONFIG');
    
    // Processing Options
    const [removeBg, setRemoveBg] = useState(true);
    const [addCutLine, setAddCutLine] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const anchorInputRef = useRef<HTMLInputElement>(null); // Ref for anchor input
    const promptData = usePromptGenerator(settings);

    // --- HANDLERS (Defined before effects to avoid TDZ) ---

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        const remaining = 10 - refs.length;
        files.slice(0, remaining).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setRefs(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAnchorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setAnchorImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
        if (anchorInputRef.current) anchorInputRef.current.value = '';
    };

    const handleAddPreset = (preset: any) => {
        if (selectedEmotions.length >= 5) return;
        const newEmotion: SelectedEmotion = {
            id: Date.now().toString() + Math.random(),
            key: preset.id,
            label: language === 'ru' ? preset.nameRu : preset.nameEn,
            prompt: preset.prompt,
            text: textLang === 'RU' ? preset.textRu : preset.textEn,
            showText: true
        };
        setSelectedEmotions(prev => [...prev, newEmotion]);
    };

    const handleAddCustom = () => {
        if (selectedEmotions.length >= 5 || !customEmotionInput.trim()) return;
        const newEmotion: SelectedEmotion = {
            id: Date.now().toString(),
            key: 'CUSTOM',
            label: 'Custom',
            prompt: customEmotionInput,
            text: '',
            showText: false
        };
        setSelectedEmotions(prev => [...prev, newEmotion]);
        setCustomEmotionInput('');
    };

    const handleRemoveEmotion = (id: string) => {
        setSelectedEmotions(prev => prev.filter(e => e.id !== id));
    };

    const handleToggleText = (id: string) => {
        setSelectedEmotions(prev => prev.map(e => e.id === id ? { ...e, showText: !e.showText } : e));
    };

    const handleUpdateText = (id: string, newText: string) => {
        setSelectedEmotions(prev => prev.map(e => e.id === id ? { ...e, text: newText } : e));
    };

    const handleCopyEmotionPrompt = (item: SelectedEmotion) => {
        let styleName = "";
        if (settings.style === 'CUSTOM' && settings.customStyle) {
            styleName = settings.customStyle.style_metadata.vibe_description;
        } else {
            styleName = t(STYLE_LIBRARY[settings.style as StyleKey]?.nameKey || '');
        }
        const isPro = settings.modelTier === 'PRO';
        const promptObj = generateUniversalStickerPackPrompt({
            basePrompt: promptData.prompt,
            emotionPrompt: item.prompt,
            isPro,
            style: styleName,
            hasAnchor: !!(anchorImage || refs.length > 0),
            stickerText: item.showText ? item.text : null,
            textPosition
        });

        navigator.clipboard.writeText(promptObj.text).then(() => {
            setCopiedPromptId(item.id);
            setTimeout(() => setCopiedPromptId(null), 2000);
        });
    };

    const generateUniversalStickerPackPrompt = (params: {
        basePrompt: string,
        emotionPrompt: string,
        isPro: boolean,
        style: string,
        hasAnchor: boolean,
        stickerText: string | null,
        textPosition: PackTextPosition
    }) => {
        const { basePrompt, emotionPrompt, isPro, style, hasAnchor, stickerText, textPosition } = params;
        
        let compositionPrompt = `- TYPE: Die-cut sticker design.\n- BACKGROUND: PURE WHITE #FFFFFF. NO NOISE.\n- FRAMING: Full object visible. Medium shot.\n- MARGINS: Leave empty white space around the subject.`;
        
        compositionPrompt += `\n${PRO_STICKER_CONTOUR_PROMPT}`;

        let textInstruction = "";
        let negativeTextConstraint = "";
        
        if (stickerText) {
            let placementDesc = "";
            switch (textPosition) {
                case 'TOP': placementDesc = "at the TOP of the sticker"; break;
                case 'BOTTOM': placementDesc = "at the BOTTOM of the sticker"; break;
                case 'INTEGRATED': placementDesc = "integrated into the design (e.g. on a sign, shirt, or object)"; break;
                default: placementDesc = "at the bottom";
            }

            textInstruction = `
            === TEXT REQUIREMENT ===
            - RENDER TEXT: "${stickerText}"
            - PLACEMENT: The text must be ${placementDesc}.
            - STYLE: Bold, legible typography that matches the sticker's art style.
            - CONSTRAINT: NO SPEECH BUBBLES. NO BALLOONS. The text must be a graphical element of the sticker itself, floating or integrated, NOT inside a white speech bubble.
            `;
        } else {
             // Strong negative constraint for subsequent stickers to avoid leaking anchor text
             textInstruction = `
             === TEXT REQUIREMENT ===
             - ABSOLUTELY NO TEXT. NO SPEECH BUBBLES. NO WRITING. 
             - Pure character art only.
             `;
             negativeTextConstraint = ", text, speech bubble, words, letters, signature, watermark, balloon";
        }

        const anchorInstruction = hasAnchor ? `
            === STYLE TRANSFER (CRITICAL) ===
            - REFERENCE: The LAST image provided is your STYLE ANCHOR.
            - COPY: The art style, line weight, shading, color palette, and character proportions.
            - IGNORE: The pose, action, and any text/objects from the anchor. Create a NEW pose based on the requested emotion.
        ` : `
            ESTABLISH STYLE: This is the first sticker of a pack. Create a definitive style based on: ${style}.
        `;

        const negativePrompt = NEGATIVE_PROMPTS.ISOLATION + negativeTextConstraint + ", speech bubble, chat bubble, thought bubble";

        return {
            text: `
            TASK: Generate ONE SINGLE ISOLATED STICKER.
            SUBJECT: ${basePrompt}
            EMOTION/ACTION: ${emotionPrompt}
            
            ${anchorInstruction}

            === CHARACTER CONSISTENCY ===
            ${isPro ? `
            - Identity Lock: 100% match to reference facial features.
            - Do NOT change age, species, or key accessories.
            ` : `
            - Keep the character recognizable.
            `}
            
            ${textInstruction}

            === COMPOSITION ===
            ${compositionPrompt}

            NEGATIVE PROMPT: ${negativePrompt}
        `.trim()
        };
    };

    const handleGenerate = async () => {
        if (!license || isGenerating || selectedEmotions.length === 0) return;
        
        if (settings.modelTier === 'PRO') {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) await (window as any).aistudio.openSelectKey();
            } catch (e) { console.error("API Key selection error", e); }
        }

        setMobileTab('RESULTS');
        setIsGenerating(true); setProgress(0); setError(null);
        setResults([]);
        
        try {
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            
            // If user provided a manual anchor, use it from the start. 
            // Otherwise, aiAnchor starts null and gets populated after the first generation.
            let effectiveAnchor = anchorImage || null; 

            for (let i = 0; i < selectedEmotions.length; i++) {
                const emotionObj = selectedEmotions[i];

                if (!(await useLicenseCredit(license.key))) throw new Error(t('error.limitReached'));
                onUsageUpdate(license.usage.usedGenerations + 1);

                const parts: any[] = [];
                const isPro = settings.modelTier === 'PRO';
                
                // Construct Style Name based on current settings
                let styleName = "";
                if (settings.style === 'CUSTOM' && settings.customStyle) {
                     styleName = settings.customStyle.style_metadata.vibe_description;
                } else {
                     styleName = t(STYLE_LIBRARY[settings.style as StyleKey].nameKey);
                }

                // Add user references (Source of Truth for Subject)
                for (const ref of refs) {
                    const b64Ref = await blobUrlToBase64(ref);
                    parts.push({ inlineData: { mimeType: 'image/png', data: b64Ref.split(',')[1] } });
                }
                
                // Add effective anchor (Manual or Generated)
                // If effectiveAnchor exists, we pass it. 
                // This means if user uploaded an anchor, it's used for i=0. 
                // If they didn't, i=0 runs without anchor, generates one, and subsequent iterations use it.
                if (effectiveAnchor) {
                    const b64Anchor = await blobUrlToBase64(effectiveAnchor);
                    parts.push({ inlineData: { mimeType: 'image/png', data: b64Anchor.split(',')[1] } });
                }

                const promptObj = generateUniversalStickerPackPrompt({
                    basePrompt: promptData.prompt,
                    emotionPrompt: emotionObj.prompt,
                    isPro,
                    style: styleName,
                    hasAnchor: !!effectiveAnchor, // Use anchor if we have one
                    stickerText: emotionObj.showText ? emotionObj.text : null,
                    textPosition
                });

                parts.push({ text: promptObj.text });

                const response = await ai.models.generateContent({
                    model: isPro ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview',
                    contents: { parts },
                    config: { imageConfig: { aspectRatio: "1:1" } }
                });

                let img: string | null = null;
                if (response.candidates) {
                    for (const cand of response.candidates) {
                        if (cand.content?.parts) {
                            for (const part of cand.content.parts) {
                                if (part.inlineData) { img = `data:image/png;base64,${part.inlineData.data}`; break; }
                            }
                        }
                        if (img) break;
                    }
                }
                
                if (img) {
                    // If we didn't have a manual anchor, use the first result as the anchor for subsequent gens
                    if (!anchorImage && i === 0) {
                        effectiveAnchor = img;
                    }

                    // Process image if options selected
                    if (removeBg || addCutLine) {
                        try {
                            img = await processStickerImage(img, {
                                removeBackground: removeBg,
                                addCutLine: addCutLine,
                                cutLineThickness: 20,
                                stickerShape: 'NONE'
                            });
                        } catch (processErr) {
                            console.warn("Post-processing failed", processErr);
                        }
                    }

                    setResults(prev => [...prev, img!]);
                    saveToHistory({ id: `${Date.now()}-${i}`, imageData: img!, prompt: `${emotionObj.label}: ${promptData.prompt}`, settings: settings });
                }
                
                setProgress(((i + 1) / selectedEmotions.length) * 100);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (e: any) {
            if (e.message && e.message.includes("Requested entity was not found.")) {
                setError(t('error.apiKey'));
                await (window as any).aistudio.openSelectKey();
            } else {
                setError(e.message || "Pack generation failed");
            }
        } finally { setIsGenerating(false); }
    };

    const handleDownloadZip = async () => {
        if (results.length === 0) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            for (let i = 0; i < results.length; i++) {
                const url = results[i];
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                zip.file(`sticker-${i + 1}.png`, arrayBuffer);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `sticker-pack-${Date.now()}.zip`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
        } catch (e) {
            console.error(e);
            setError("ZIP Error");
        } finally {
            setIsZipping(false);
        }
    };

    const handleImageClick = (src: string) => {
        setPreviewImage(src);
        setPreviewZoom(1);
    };

    // --- EFFECTS ---

    // Auto-disable cutline for PRO model
    useEffect(() => {
        if (settings.modelTier === 'PRO') {
            setAddCutLine(false);
        } else {
            setAddCutLine(true); // Default to true for other models
        }
    }, [settings.modelTier]);

    // Initial population for demo (if empty)
    useEffect(() => {
        if (selectedEmotions.length === 0 && EMOTION_LIBRARY.length > 0) {
             // Add a default one
             const first = EMOTION_LIBRARY[0].emotions[0];
             handleAddPreset(first);
        }
    }, []);

    // Update text language when toggle changes
    useEffect(() => {
        setSelectedEmotions(prev => prev.map(em => {
            // Find original preset to get the correct translation
            if (em.key !== 'CUSTOM') {
                for (const cat of EMOTION_LIBRARY) {
                    const preset = cat.emotions.find(p => p.id === em.key);
                    if (preset) {
                        return { 
                            ...em, 
                            text: textLang === 'RU' ? preset.textRu : preset.textEn,
                            label: language === 'ru' ? preset.nameRu : preset.nameEn
                        };
                    }
                }
            }
            return em;
        }));
    }, [textLang, language]);

    if (!isOpen) return null;

    const renderEmotionSelector = () => (
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t('pack.presets.title')}</span>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                     <button 
                         onClick={() => setTextLang('RU')} 
                         className={`px-2 py-0.5 text-[9px] font-bold rounded ${textLang === 'RU' ? 'bg-[#A8D5D8] text-white' : 'text-slate-400'}`}
                     >RU</button>
                     <button 
                         onClick={() => setTextLang('EN')} 
                         className={`px-2 py-0.5 text-[9px] font-bold rounded ${textLang === 'EN' ? 'bg-[#A8D5D8] text-white' : 'text-slate-400'}`}
                     >EN</button>
                </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {EMOTION_LIBRARY.map(cat => (
                    <div key={cat.id} className="border-b border-slate-100 last:border-0">
                        <button 
                            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition"
                        >
                            <span className="text-xs font-bold text-slate-700">{language === 'ru' ? cat.nameRu : cat.nameEn}</span>
                            <span className="text-[10px] text-slate-400">{expandedCategory === cat.id ? '▼' : '▶'}</span>
                        </button>
                        
                        {expandedCategory === cat.id && (
                            <div className="p-2 bg-slate-50 grid grid-cols-2 gap-2 animate-fade-in">
                                {cat.emotions.map(emotion => (
                                    <button
                                        key={emotion.id}
                                        onClick={() => handleAddPreset(emotion)}
                                        disabled={selectedEmotions.length >= 5}
                                        className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] hover:border-sky-300 hover:text-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed truncate"
                                        title={language === 'ru' ? emotion.nameRu : emotion.nameEn}
                                    >
                                        {language === 'ru' ? emotion.nameRu : emotion.nameEn}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                 <input 
                    type="text" 
                    value={customEmotionInput}
                    onChange={e => setCustomEmotionInput(e.target.value)}
                    placeholder={t('generator.batch.label')}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-300"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                 />
                 <button 
                    onClick={handleAddCustom}
                    disabled={!customEmotionInput.trim() || selectedEmotions.length >= 5}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    +
                 </button>
            </div>
        </div>
    );

    const renderActiveSlots = () => (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('pack.slots')} ({selectedEmotions.length}/5)</span>
                <button onClick={() => setSelectedEmotions([])} className="text-[9px] text-red-400 hover:text-red-600 font-bold uppercase">{t('pack.clear')}</button>
            </div>
            
            <div className="space-y-2 min-h-[100px]">
                {selectedEmotions.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-sm animate-slide-up">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 flex-shrink-0">
                            {idx + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-700 truncate mr-2" title={item.label}>{item.label}</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleCopyEmotionPrompt(item)}
                                        className={`px-1.5 py-0.5 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${copiedPromptId === item.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        title={copiedPromptId === item.id ? "Скопировано!" : "Скопировать промт эмоции"}
                                    >
                                        {copiedPromptId === item.id ? '✓' : '📋'}
                                    </button>
                                    <button 
                                        onClick={() => handleToggleText(item.id)}
                                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${item.showText ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                                        title="Вкл/Выкл текст"
                                    >T</button>
                                </div>
                            </div>
                            {item.showText && (
                                <input 
                                    type="text" 
                                    value={item.text}
                                    onChange={(e) => handleUpdateText(item.id, e.target.value)}
                                    className="w-full px-2 py-1 text-[10px] bg-slate-50 border border-slate-100 rounded focus:border-sky-300 outline-none text-slate-600"
                                />
                            )}
                        </div>

                        <button onClick={() => handleRemoveEmotion(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                            ✕
                        </button>
                    </div>
                ))}
                
                {selectedEmotions.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-xs text-slate-400">{t('pack.empty_hint')}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-2 md:p-4">
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} images={results} />
            
            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition"
                    >
                        ✕
                    </button>

                    <div 
                        className="relative w-full max-w-4xl h-full flex items-center justify-center overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                         <img 
                            src={previewImage} 
                            className="max-w-full max-h-full object-contain transition-transform duration-200" 
                            style={{ transform: `scale(${previewZoom})` }}
                            alt="Preview" 
                        />
                    </div>

                    <div className="absolute bottom-8 flex gap-4 bg-black/50 p-2 rounded-2xl backdrop-blur-md border border-white/10" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.5))}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-white/20 text-xl font-bold transition"
                        >
                            -
                        </button>
                        <div className="flex items-center justify-center px-4 font-mono text-white/70">
                            {Math.round(previewZoom * 100)}%
                        </div>
                        <button 
                            onClick={() => setPreviewZoom(z => Math.min(5, z + 0.5))}
                            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl text-white hover:bg-white/20 text-xl font-bold transition"
                        >
                            +
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-[#F5F3F0] w-full max-w-5xl h-[95vh] md:h-[90vh] rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                <header className="p-4 md:p-8 flex items-center justify-between border-b border-[#E8E3DC] bg-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter">📦 {t('pack.title')}</h2>
                            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest hidden sm:block">{t('pack.subtitle')}</p>
                        </div>
                        
                        {/* Mobile View Toggle */}
                        <div className="flex md:hidden bg-slate-100 rounded-lg p-1 ml-2">
                            <button 
                                onClick={() => setMobileTab('CONFIG')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${mobileTab === 'CONFIG' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                            >
                                ⚙️
                            </button>
                            <button 
                                onClick={() => setMobileTab('RESULTS')}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${mobileTab === 'RESULTS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                            >
                                🖼️
                            </button>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    
                    {/* CONFIG PANEL */}
                    <aside className={`
                        w-full md:w-96 bg-white border-r border-[#E8E3DC] flex flex-col overflow-y-auto pastel-scroll flex-shrink-0
                        ${mobileTab === 'CONFIG' ? 'flex' : 'hidden md:flex'}
                    `}>
                        <div className="flex-1 overflow-y-auto pastel-scroll">
                             <LadderSection label={t('category.style')} icon="🎨" active={activeSection === 'STYLE'} onClick={() => setActiveSection('STYLE')}>
                                 <StyleLibrary 
                                     selectedStyle={settings.style as StyleKey}
                                     onSelectStyle={(s) => onSettingsChange('style', s)}
                                     interpretationMode={settings.interpretationMode}
                                     onModeChange={(m) => onSettingsChange('interpretationMode', m)}
                                     userStyles={userStyles}
                                     onDeleteUserStyle={onDeleteUserStyle}
                                 />
                             </LadderSection>

                            <LadderSection label={t('panel.configuration')} icon="⚙️" active={activeSection === 'CONFIG'} onClick={() => setActiveSection('CONFIG')}>
                                <div className="space-y-4">
                                     <PastelSelect 
                                        label={t('label.model')} 
                                        value={settings.modelTier} 
                                        onChange={(v) => onSettingsChange('modelTier', v as any)} 
                                        options={[
                                            { value: 'FAST', label: t('option.fast') }, 
                                            { value: 'PRO', label: t('option.pro'), disabled: !license?.features.allowPro }
                                        ]} 
                                     />

                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('pack.references')}</h3>
                                        <div className="grid grid-cols-5 gap-1">
                                            {refs.map((r, i) => (
                                                <div key={i} className="aspect-square rounded-md overflow-hidden border border-slate-100 group relative">
                                                    <img src={r} className="w-full h-full object-cover" />
                                                    <button onClick={() => setRefs(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold">{t('action.deleteShort')}</button>
                                                </div>
                                            ))}
                                            {refs.length < 10 && (
                                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-md border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-sky-300 hover:text-sky-300 transition-all">+</button>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="image/*" className="hidden" />
                                        <p className="text-[9px] text-slate-400 leading-tight italic hidden sm:block">{t('pack.info.multiRef')}</p>
                                    </div>
                                    
                                    {/* Manual Anchor Input */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('pack.anchor.label')}</h3>
                                            {anchorImage && <button onClick={() => setAnchorImage(null)} className="text-[8px] font-bold text-red-400 hover:text-red-600">{t('pack.clear')}</button>}
                                        </div>
                                        <div 
                                            onClick={() => anchorInputRef.current?.click()}
                                            className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${anchorImage ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}`}
                                        >
                                            {anchorImage ? (
                                                <img src={anchorImage} className="w-full h-full object-cover opacity-80" alt="Anchor" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{t('pack.anchor.upload')}</span>
                                            )}
                                            <input type="file" ref={anchorInputRef} onChange={handleAnchorUpload} accept="image/*" className="hidden" />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                         <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('label.processing')}</h3>
                                         <div className="flex flex-col gap-2">
                                             <CosmicToggle label={t('label.transparentBg')} checked={removeBg} onChange={setRemoveBg} />
                                             <CosmicToggle label={t('label.cutLine')} checked={addCutLine} onChange={setAddCutLine} />
                                         </div>
                                    </div>
                                </div>
                            </LadderSection>

                            <LadderSection label={t('generator.batch.label')} icon="😊" active={activeSection === 'EMOTIONS'} onClick={() => setActiveSection('EMOTIONS')}>
                                <div className="space-y-4">
                                     {renderEmotionSelector()}
                                     
                                     <div className="pt-2">
                                        <PastelSelect 
                                            label={t('pack.text_placement')}
                                            value={textPosition} 
                                            onChange={(v) => setTextPosition(v as any)} 
                                            options={[
                                                { value: 'BOTTOM', label: t('pack.pos_bottom') }, 
                                                { value: 'TOP', label: t('pack.pos_top') },
                                                { value: 'INTEGRATED', label: t('pack.pos_integrated') }
                                            ]} 
                                        />
                                     </div>

                                     {renderActiveSlots()}
                                </div>
                            </LadderSection>
                        </div>
                        
                        <div className="p-4 bg-white border-t border-[#E8E3DC]">
                            <SparkleButton 
                                onClick={handleGenerate} 
                                disabled={isGenerating || selectedEmotions.length === 0}
                                isProcessing={isGenerating}
                            >
                                {isGenerating ? t('generator.stop') : '✨ ' + t('harmony.action.generate')}
                            </SparkleButton>
                            
                            {results.length > 0 && (
                                <div className="flex flex-col gap-2 mt-3">
                                    <button 
                                        onClick={() => { onOpenPrint(results); onClose(); }}
                                        className="w-full py-3 md:py-4 rounded-2xl bg-[#5A5A5A] text-white font-black uppercase tracking-widest shadow-lg hover:bg-[#4A4A4A] transition-all flex items-center justify-center gap-2"
                                    >
                                        🖨️ {t('pack.action.layout')}
                                    </button>
                                    <button 
                                        onClick={handleDownloadZip}
                                        disabled={isZipping}
                                        className="w-full py-3 md:py-4 rounded-2xl border-2 border-indigo-200 text-indigo-600 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isZipping ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : '💾'} 
                                        {t('action.downloadBatch')}
                                    </button>
                                    <button 
                                        onClick={() => setIsExportModalOpen(true)}
                                        className="w-full py-3 md:py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black uppercase tracking-widest hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        🚀 {t('export.action.share')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* RESULTS PANEL */}
                    <main className={`
                        flex-1 bg-[#F5F3F0] p-4 md:p-8 overflow-y-auto custom-scrollbar flex-col
                        ${mobileTab === 'RESULTS' ? 'flex' : 'hidden md:flex'}
                    `}>
                        {isGenerating && (
                            <div className="mb-4 md:mb-8 w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner flex-shrink-0">
                                <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                        
                        {results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {results.map((r, i) => (
                                    <div 
                                        key={i} 
                                        className="clean-card aspect-square p-2 bg-white animate-fade-in group relative cursor-pointer hover:border-[#A8D5D8] transition-colors"
                                        onClick={() => handleImageClick(r)}
                                    >
                                        <img src={r} className="w-full h-full object-contain" alt="Pack result" />
                                        <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur rounded p-1 text-center">
                                            <span className="text-[9px] font-bold text-slate-700 uppercase truncate block">
                                                {selectedEmotions[i]?.label || 'Sticker'}
                                            </span>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1 shadow-sm">
                                             <span className="text-xs">🔍</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                <span className="text-6xl md:text-8xl mb-4">📦</span>
                                <p className="font-bold text-sm md:text-xl uppercase tracking-widest">{t('state.emptyCanvas')}</p>
                            </div>
                        )}

                        {error && <p className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold animate-slide-up">⚠️ {error}</p>}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default StickerPackModal;
