
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { useTranslation } from '../contexts/LanguageContext';
import { License, ModelTier, StickerMode, StickerShape, StyleBlueprint, AspectRatio } from '../types';
import { useLicenseCredit } from '../utils/licenseManager';
import { upscalerService } from '../utils/upscaler';
import { processStickerImage, blobUrlToBase64 } from '../utils/imageProcessor';
import { analyzeStickerOutline } from '../utils/smartTracer';
import { saveUserStyle, saveToHistory } from '../utils/db';
import { INITIAL_SETTINGS, NEGATIVE_PROMPTS } from '../constants';
import MultiCircleLoader from './MultiCircleLoader';
import CosmicToggle from './CosmicToggle';
import SparkleButton from './SparkleButton';
import OptionSelector from './OptionSelector';

interface StyleTransposerModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
    onOpenPrint: (images: string[]) => void;
    onStyleSaved?: () => void;
    isDevMode: boolean;
}

const StyleTransposerModal: React.FC<StyleTransposerModalProps> = ({ 
    isOpen, onClose, license, onUsageUpdate, onOpenPrint, onStyleSaved, isDevMode
}) => {
    const { t } = useTranslation();
    
    // Wizard State
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    // Data State
    const [styleRefs, setStyleRefs] = useState<string[]>([]);
    const [targetImg, setTargetImg] = useState<string | null>(null);
    const [blueprint, setBlueprint] = useState<StyleBlueprint | null>(null);
    const [resultImg, setResultImg] = useState<string | null>(null);
    
    // Processing State
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [saveName, setSaveName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Config State
    const [modelTier, setModelTier] = useState<ModelTier>('PRO');
    const [stickerMode, setStickerMode] = useState<StickerMode>('ISOLATION');
    const [stickerShape, setStickerShape] = useState<StickerShape>('CIRCLE');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [doUpscale, setDoUpscale] = useState(true);
    const [addCutLine, setAddCutLine] = useState(true);
    const [removeBackground, setRemoveBackground] = useState(true);

    // Locks State
    const [poseLock, setPoseLock] = useState(true);
    const [cameraLock, setCameraLock] = useState(true);
    const [detailLock, setDetailLock] = useState(false);

    const styleInputRef = useRef<HTMLInputElement>(null);
    const targetInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // --- Actions ---

    const handleModeChange = (mode: StickerMode) => {
        setStickerMode(mode);
        if (mode === 'FULL_IMAGE') {
            setRemoveBackground(false);
            setAddCutLine(false);
            setAspectRatio('1:1');
        } else if (mode === 'ISOLATION') {
            setRemoveBackground(true);
            setAddCutLine(true);
            setAspectRatio('1:1');
        } else {
             // CONTAINER
             setRemoveBackground(true); 
             setAddCutLine(true);
             setAspectRatio('1:1');
        }
    };

    const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        const remaining = 10 - styleRefs.length;
        files.slice(0, remaining).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setStyleRefs(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
        setBlueprint(null); 
    };

    const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setTargetImg(ev.target?.result as string);
                // Auto advance if we are on step 2
                if(step === 2) setStep(3);
            };
            reader.readAsDataURL(file);
        }
    };

    const copyBlueprint = () => {
        if (!blueprint) return;
        navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
        alert(t('transposer.alert.copied'));
    };

    const constructPrompt = (bp: StyleBlueprint) => {
        let compositionRules = "";
        if (stickerMode === 'ISOLATION') {
            compositionRules = "### COMPOSITION: ISOLATION MODE. Pure white background #FFFFFF. Strong outer contour. No shadows. No floor.";
        } else if (stickerMode === 'CONTAINER') {
             compositionRules = `### COMPOSITION: CONTAINER MODE. Subject trapped inside a ${stickerShape} shape. Internal background styled.`;
        } else if (stickerMode === 'FULL_IMAGE') {
             compositionRules = "### COMPOSITION: FULL IMAGE CANVAS. Edge-to-edge artwork. Complete scene composition. NO white borders. NO cutout style. Use the entire aspect ratio.";
        }

        let lockDirectives = "### GEOMETRY LOCK [CRITICAL]\n";
        if (poseLock) lockDirectives += "- POSE: Strictly maintain original limb positions and body pose.\n";
        if (cameraLock) lockDirectives += "- CAMERA: Reproduce exact perspective and angle of the subject.\n";
        if (detailLock) lockDirectives += "- DETAIL: Preserve intricate textures and fine micro-features.\n";
        if (!poseLock && !cameraLock) lockDirectives += "- FREEFORM: Artistic subject reinterpretation allowed.\n";

        return `
            ### TASK: STYLE SYNTHESIS (The Forge)
            
            Transform the SUBJECT from the input image into the target style defined below.
            
            ${lockDirectives}
            
            ### TARGET VISUAL DNA (StyleBlueprint)
            - STYLE: ${bp.style_metadata.vibe_description}
            - COLOR PALETTE: ${bp.color_logic.dominant_palette.join(", ")}. Rules: ${bp.color_logic.shading_rules}
            - LINE WORK: ${bp.line_logic.weight}, ${bp.line_logic.stroke_dna}. ${bp.line_logic.outline_consistency}
            - VFX & TEXTURE: ${bp.vfx_textures.noise_and_grit}. Lighting: ${bp.vfx_textures.lighting_model}
            - CRITICAL INVARIANTS: ${bp.invariants.join(", ")}
            
            ${compositionRules}
            
            ### EXECUTION
            Render the subject using ONLY the visual language defined in the DNA. Discard original photo textures/colors.
        `;
    };

    const extractStyleDNA = async () => {
        if (styleRefs.length === 0 || !license) return;
        setIsExtracting(true); setError(null);
        setStatusMessage(t('transposer.status.extracting'));
        try {
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const parts: any[] = [];
            
            for (const ref of styleRefs) {
                const b64 = await blobUrlToBase64(ref);
                parts.push({ inlineData: { mimeType: 'image/png', data: b64.split(',')[1] } });
            }
            
            const systemInstruction = `Ты — 'Visual DNA Cloner', ведущий эксперт по компьютерному зрению и техническому анализу цифрового искусства. 
Твоя задача: провести глубокую деконструкцию предоставленных изображений-референсов и извлечь их 'стилистический генетический код'. 
Ты должен игнорировать СУБЪЕКТ (объект на фото) и сосредоточиться исключительно на ТЕХНОЛОГИИ визуализации.

ANALYSIS PROTOCOL:
1. Invariant Search: Проанализируй все изображения. Найди визуальные элементы, которые повторяются.
2. Technical Deconstruction: Разложи стиль на цветовые веса, динамику линий, характер теней и текстуры.
3. Negative Constraints: Определи, какие приемы НАМЕРЕННО отсутствуют.

OUTPUT FORMAT: Return STRICT JSON only matching the schema.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: parts },
                config: { 
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            style_metadata: {
                                type: Type.OBJECT,
                                properties: {
                                    vibe_description: { type: Type.STRING, description: "Technical description of the aesthetic" },
                                    complexity_score: { type: Type.NUMBER, description: "0.0 to 1.0" }
                                }
                            },
                            color_logic: {
                                type: Type.OBJECT,
                                properties: {
                                    dominant_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    harmony_type: { type: Type.STRING },
                                    shading_rules: { type: Type.STRING }
                                }
                            },
                            line_logic: {
                                type: Type.OBJECT,
                                properties: {
                                    weight: { type: Type.STRING },
                                    stroke_dna: { type: Type.STRING },
                                    outline_consistency: { type: Type.STRING }
                                }
                            },
                            vfx_textures: {
                                type: Type.OBJECT,
                                properties: {
                                    noise_and_grit: { type: Type.STRING },
                                    overlay_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    lighting_model: { type: Type.STRING }
                                }
                            },
                            negative_dna: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Visual elements that are strictly absent"
                            },
                            invariants: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Critical style markers"
                            }
                        },
                        required: ["style_metadata", "color_logic", "line_logic", "vfx_textures", "negative_dna", "invariants"]
                    }
                }
            });

            const result = JSON.parse(response.text || '{}') as StyleBlueprint;
            setBlueprint(result);
            setSaveName(result.style_metadata?.vibe_description || "New Style");
            setStep(2); // Advance to next step
        } catch (e: any) {
            setError(t('error.analysisFailed') + e.message);
        } finally { setIsExtracting(false); setStatusMessage(''); }
    };

    const handleSaveToLibrary = async () => {
        if (!blueprint || !saveName.trim()) return;
        setIsSaving(true);
        try {
            await saveUserStyle({
                id: `USER_STYLE_${Date.now()}`,
                name: saveName.trim(),
                emoji: "🧬",
                category: 'ART_TECHNIQUES',
                blueprint: blueprint,
                timestamp: Date.now()
            });
            setSaveName('');
            alert(t('transposer.alert.saved'));
            onStyleSaved?.();
        } catch (e) {
            console.error(e);
        } finally { setIsSaving(false); }
    };

    const handleForge = async () => {
        if (!targetImg || !license || !blueprint) return;
        
        setStep(4); // Move to result/processing step
        setIsGenerating(true); setError(null);
        setStatusMessage(t('transposer.status.generating'));
        
        try {
            if (modelTier === 'PRO') {
                try {
                    // Safe access to window.aistudio
                    if (typeof (window as any).aistudio !== 'undefined') {
                        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                        if (!hasKey) await (window as any).aistudio.openSelectKey();
                    }
                } catch (e) { 
                    console.warn("AI Studio key check skipped:", e); 
                }
            }

            if (!(await useLicenseCredit(license.key))) throw new Error(t('error.licenseLimit'));
            onUsageUpdate(license.usage.usedGenerations + 1);

            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const modelName = modelTier === 'PRO' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
            const isFastModel = modelTier === 'FAST';
            
            const negativeConstraints = blueprint.negative_dna?.join(", ") || "";
            const fastIsolationNegatives = isFastModel && stickerMode === 'ISOLATION' ? "gradient background, colored background, noise, floor, wall, shadow, contact shadow, texture" : "";
            
            let baseNegative = NEGATIVE_PROMPTS.CONTAINER;
            if (stickerMode === 'ISOLATION') {
                baseNegative = "background, scene, wall, floor, room, environment, landscape, shadow, drop shadow, ambient occlusion, ground plane, contact shadows, cast shadows, floor lighting, reflections, noise, gradient background, border, frame, edge, container, square, rectangle, blueprint, grid, paper, poster, sheet, ground";
            } else if (stickerMode === 'FULL_IMAGE') {
                baseNegative = "white background, isolated, cut-out, border, frame, watermark, signature";
            }

            const finalNegative = `${baseNegative}, ${negativeConstraints}, ${fastIsolationNegatives}`;

            const textPrompt = constructPrompt(blueprint) + `

            ### NEGATIVE_CONSTRAINTS
            - DO NOT GENERATE: ${finalNegative}
            `;
            
            // Ensure target is Base64 for API
            const b64Target = await blobUrlToBase64(targetImg);

            const parts = [
                { inlineData: { mimeType: 'image/png', data: b64Target.split(',')[1] } },
                { text: textPrompt }
            ];

            const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts },
                config: { 
                    imageConfig: { aspectRatio: aspectRatio },
                    temperature: (poseLock || cameraLock) ? 0.05 : 0.2,
                }
            });

            let baseImage = null;
            if (response.candidates) {
                for (const cand of response.candidates) {
                    if (cand.content?.parts) {
                        for (const part of cand.content.parts) {
                            if (part.inlineData) { baseImage = `data:image/png;base64,${part.inlineData.data}`; break; }
                        }
                    }
                    if (baseImage) break;
                }
            }

            if (!baseImage) throw new Error(t('error.noImageAI'));

            setIsProcessing(true);
            let processed = baseImage;
            
            if (doUpscale) {
                setStatusMessage("🚀 " + t('upscaler.processing'));
                processed = await upscalerService.upscale(processed);
            }

            let aiOutlineConfig = undefined;
            if (addCutLine) {
                setStatusMessage(t('status.silhouetteAnalysis'));
                aiOutlineConfig = await analyzeStickerOutline(processed);
            }

            setStatusMessage(t('status.vectorPaths'));
            const toleranceValue = isFastModel ? 65 : 55; 
            
            processed = await processStickerImage(processed, {
                removeBackground: removeBackground,
                addCutLine: addCutLine,
                cutLineThickness: doUpscale ? 60 : 20,
                hardenEdges: true,
                tolerance: toleranceValue,
                stickerShape: stickerMode === 'CONTAINER' ? stickerShape : 'NONE',
                aiOutlineConfig
            });

            setResultImg(processed);
            
            saveToHistory({
                id: `TRANSPOSE_${Date.now()}`,
                imageData: processed,
                prompt: `Style Transpose: ${blueprint.style_metadata.vibe_description}`,
                settings: {
                    ...INITIAL_SETTINGS,
                    style: 'CUSTOM',
                    customStyle: blueprint,
                    stickerMode: stickerMode,
                    stickerShape: stickerShape,
                    aspectRatio: aspectRatio
                }
            });

        } catch (e: any) {
            // Handle missing key error robustly
            if (e.message?.includes("Requested entity was not found.")) {
                setError(t('error.proKeyRequired'));
                try {
                    if (typeof (window as any).aistudio !== 'undefined') {
                        await (window as any).aistudio.openSelectKey();
                    }
                } catch (err) { console.error(err); }
            } else {
                setError(e.message || t('error.forgeFailed'));
            }
        } finally { 
            setIsGenerating(false); 
            setIsProcessing(false);
            setStatusMessage(''); 
        }
    };

    const handleDownload = () => {
        if (!resultImg) return;
        const link = document.createElement('a');
        link.href = resultImg;
        link.download = `transpose-${Date.now()}.png`;
        link.click();
        
        if(resultImg.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(resultImg), 1000);
        }
    };

    const handleReset = () => {
        setStep(1);
        setResultImg(null);
        setTargetImg(null);
        setStyleRefs([]);
        setBlueprint(null);
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter mb-2">Шаг 1: ДНК Стиля</h3>
                <p className="text-sm text-slate-500">Загрузите изображения, стиль которых хотите скопировать.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 mb-6 relative">
                 {styleRefs.length === 0 && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                         <span className="text-6xl mb-4">🧬</span>
                         <span className="font-bold uppercase tracking-widest">Перетащите фото сюда</span>
                     </div>
                 )}
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 relative z-10">
                    {styleRefs.map((ref, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm relative group bg-white">
                            <img src={ref} className="w-full h-full object-cover" />
                            <button onClick={() => setStyleRefs(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
                        </div>
                    ))}
                    {styleRefs.length < 10 && (
                        <button onClick={() => styleInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all bg-white">
                            <span className="text-4xl">+</span>
                        </button>
                    )}
                 </div>
                 <input type="file" ref={styleInputRef} onChange={handleStyleUpload} multiple accept="image/*" className="hidden" />
            </div>

            <button 
                onClick={extractStyleDNA}
                disabled={isExtracting || styleRefs.length === 0}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${isExtracting || styleRefs.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
            >
                {isExtracting ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('transposer.status.extracting')}
                    </div>
                ) : "Извлечь ДНК Стиля"}
            </button>
        </div>
    );

    const renderStep2 = () => (
         <div className="flex flex-col h-full animate-fade-in">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter mb-2">Шаг 2: Цель</h3>
                <p className="text-sm text-slate-500">Загрузите фото объекта, который нужно стилизовать.</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                 <div 
                    onClick={() => targetInputRef.current?.click()}
                    className={`w-full max-w-md aspect-square rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${targetImg ? 'border-white bg-white shadow-2xl' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                >
                    {targetImg ? (
                        <>
                            <img src={targetImg} className="w-full h-full object-contain p-6" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <span className="text-white font-bold uppercase tracking-widest border-2 border-white px-6 py-2 rounded-full">Сменить фото</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8">
                            <span className="text-8xl mb-6 block opacity-20">🎯</span>
                            <span className="font-black text-slate-400 uppercase tracking-widest">{t('action.clickToUpload')}</span>
                        </div>
                    )}
                    <input type="file" ref={targetInputRef} onChange={handleTargetUpload} accept="image/*" className="hidden" />
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(1)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-300 transition-all">{t('action.back')}</button>
                <button onClick={() => setStep(3)} disabled={!targetImg} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl">{t('action.next')}</button>
            </div>
         </div>
    );

    const renderStep3 = () => (
        <div className="flex flex-col h-full animate-fade-in relative">
             <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter mb-2">Шаг 3: Конфигурация</h3>
                <p className="text-sm text-slate-500">Настройте параметры генерации.</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Core Settings */}
                    <div className="space-y-6">
                         <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Модель и Режим</h4>
                            <div className="flex gap-2">
                                <button onClick={() => setModelTier('FAST')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${modelTier === 'FAST' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Flash ⚡</button>
                                <button onClick={() => setModelTier('PRO')} disabled={!license?.features.allowPro} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${modelTier === 'PRO' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Pro ✨</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleModeChange('ISOLATION')} className={`p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${stickerMode === 'ISOLATION' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>{t('option.isolation')}</button>
                                <button onClick={() => handleModeChange('CONTAINER')} className={`p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${stickerMode === 'CONTAINER' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>{t('option.container')}</button>
                                <button onClick={() => handleModeChange('FULL_IMAGE')} className={`p-3 border-2 rounded-xl text-[10px] font-bold uppercase transition-all ${stickerMode === 'FULL_IMAGE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>{t('format.stickerMode.fullImage')}</button>
                            </div>
                            {stickerMode === 'CONTAINER' && (
                                <OptionSelector 
                                    name="stickerShape" 
                                    value={stickerShape} 
                                    onChange={(v) => setStickerShape(v)} 
                                    options={[{value: 'CIRCLE', label: 'Circle'}, {value: 'SQUARE', label: 'Square'}, {value: 'TRIANGLE', label: 'Triangle'}]} 
                                />
                            )}
                            {stickerMode === 'FULL_IMAGE' && (
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('advanced.aspectRatio')}</h4>
                                    <OptionSelector
                                        name="aspectRatio"
                                        value={aspectRatio}
                                        onChange={(v) => setAspectRatio(v)}
                                        options={[
                                            { value: '1:1', label: '1:1' },
                                            { value: '4:3', label: '4:3' },
                                            { value: '3:4', label: '3:4' },
                                            { value: '16:9', label: '16:9' },
                                            { value: '9:16', label: '9:16' }
                                        ]}
                                        gridCols="grid-cols-5"
                                    />
                                </div>
                            )}
                         </div>

                         <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Постобработка</h4>
                            <CosmicToggle label={t('transposer.label.upscale')} checked={doUpscale} onChange={setDoUpscale} />
                            <CosmicToggle label={t('label.transparentBg')} checked={removeBackground} onChange={setRemoveBackground} />
                            <CosmicToggle label={t('transposer.label.addCutLine')} checked={addCutLine} onChange={setAddCutLine} />
                         </div>
                    </div>

                    {/* Column 2: Locks & DNA */}
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Геометрические Замки</h4>
                            <CosmicToggle label={t('transposer.label.poseLock')} checked={poseLock} onChange={setPoseLock} />
                            <CosmicToggle label={t('transposer.label.cameraLock')} checked={cameraLock} onChange={setCameraLock} />
                            <CosmicToggle label={t('transposer.label.detailLock')} checked={detailLock} onChange={setDetailLock} />
                        </div>

                        {blueprint && (
                            <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-3 relative z-10">
                                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest">Извлеченный ДНК</h4>
                                    {isDevMode && <button onClick={copyBlueprint} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700">JSON</button>}
                                </div>
                                <p className="text-[10px] text-indigo-900 leading-relaxed font-medium relative z-10 max-h-32 overflow-y-auto custom-scrollbar">
                                    {blueprint.style_metadata.vibe_description}
                                </p>
                                
                                {/* Save Style Input */}
                                <div className="mt-4 pt-3 border-t border-indigo-200 relative z-10 flex gap-2">
                                     <input 
                                        type="text" 
                                        value={saveName} 
                                        onChange={(e) => setSaveName(e.target.value)} 
                                        placeholder="Название стиля..."
                                        className="flex-1 p-2 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                                    />
                                    <button 
                                        onClick={handleSaveToLibrary} 
                                        disabled={isSaving}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                                    >
                                        💾
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

             <div className="flex gap-4 mt-6 pt-6 border-t border-slate-200">
                <button onClick={() => setStep(2)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-300 transition-all">{t('action.back')}</button>
                <div className="flex-1">
                    <SparkleButton onClick={handleForge} className="py-4 rounded-2xl font-black text-lg shadow-xl">
                        {t('transposer.action.forge')}
                    </SparkleButton>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
         <div className="flex flex-col h-full animate-fade-in justify-center">
            {isGenerating || isProcessing ? (
                <div className="flex flex-col items-center gap-8">
                     <div className="relative">
                         <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                         <MultiCircleLoader className="transform scale-150" />
                     </div>
                     <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter animate-pulse">
                            {isProcessing ? "Финальная обработка..." : "Синтез изображения..."}
                        </h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{statusMessage}</p>
                     </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="text-center mb-6 flex-shrink-0">
                         <h3 className="text-2xl font-black text-[#5A5A5A] uppercase tracking-tighter">Результат</h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 bg-white/50 rounded-[40px] border border-white shadow-inner overflow-hidden mb-6 relative group">
                         <div className="absolute inset-0 bg-[url('/transparent-bg.png')] opacity-30 pointer-events-none" />
                         {resultImg && <img src={resultImg} className="max-w-full max-h-full object-contain drop-shadow-2xl animate-slide-up" />}
                    </div>

                    <div className="flex gap-4 flex-shrink-0">
                         <button onClick={handleReset} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-300 transition-all">Заново</button>
                         <button onClick={() => { onOpenPrint(resultImg ? [resultImg] : []); onClose(); }} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                             🖨️ {t('dashboard.print')}
                         </button>
                         <button onClick={handleDownload} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">
                             💾 {t('action.download')}
                         </button>
                    </div>
                </div>
            )}
         </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-2 md:p-4">
            <div className="bg-[#F5F3F0] w-full max-w-6xl h-[95vh] md:h-[90vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden animate-fade-in relative border-4 border-white">
                {/* Header with Progress */}
                <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-10 flex-shrink-0 relative">
                    <div className="flex items-center gap-4 z-10">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl">🧬</div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">{t('transposer.title')}</h2>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4].map(s => (
                                    <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${s <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-full transition text-slate-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex-1 overflow-hidden p-8 relative">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                         <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl" />
                         <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 h-full max-w-4xl mx-auto">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </div>
                </div>
            </div>
            
            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-6 py-4 rounded-2xl shadow-xl border border-red-100 font-bold animate-slide-up z-[200] flex items-center gap-3">
                    <span>⚠️</span>
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
                </div>
            )}
        </div>
    );
};

export default StyleTransposerModal;
