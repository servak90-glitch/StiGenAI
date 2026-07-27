
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { CardSettings, CardData, License, CardStyleKey, CardLayout, BrandKit } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { useCardPromptGenerator } from '../hooks/useCardPromptGenerator';
import { useVisionExtractor } from '../hooks/useVisionExtractor';
import { upscalerService } from '../utils/upscaler';
import { useLicenseCredit } from '../utils/licenseManager';
import { CARD_STYLE_LIBRARY, CARD_FONTS } from '../constants';
import { getCachedCardBg, saveCachedCardBg, saveBrandKit, getBrandKits, deleteBrandKit } from '../utils/db';
import { applyHueRotation, getAverageBrightness, removeBackgroundClean, blobUrlToBase64 } from '../utils/imageProcessor';
import { generateVCard } from '../utils/vcardGenerator';
import { parseCSV } from '../utils/csvParser';
import JSZip from 'jszip';
import ColorPickerControl from './ColorPickerControl';
import OptionSelector from './OptionSelector';
import PrintMasterModal from './PrintMasterModal';
import CosmicToggle from './CosmicToggle';
import SparkleButton from './SparkleButton';

interface CardGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: CardSettings;
    onSettingsChange: (s: CardSettings) => void;
    license: License | null;
    onUsageUpdate: (usage: number) => void;
}

const LadderSection = ({ 
    active, 
    label, 
    icon, 
    onClick, 
    children 
}: { 
    active: boolean, 
    label: string, 
    icon: string, 
    onClick: () => void, 
    children?: React.ReactNode 
}) => (
    <div className="border-b border-[#E8E3DC] last:border-0 bg-[#FEFCFB]">
        <button
            onClick={onClick}
            className={`
                w-full flex items-center justify-between p-4 text-left transition-all duration-200 outline-none
                ${active ? 'bg-white shadow-sm z-10 relative' : 'hover:bg-[#FAFAF8]'}
            `}
        >
            <div className="flex items-center gap-3">
                <span className="text-xl filter drop-shadow-sm">{icon}</span>
                <span className={`text-sm font-bold tracking-wide uppercase ${active ? 'text-[#5A5A5A]' : 'text-[#8B8B8B]'}`}>
                    {label}
                </span>
            </div>
            <svg
                className={`w-4 h-4 text-[#8B8B8B] transition-transform duration-300 ${active ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${active ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-white border-t border-[#F5F3F0]">
                {children}
            </div>
        </div>
    </div>
);

const OffsetSlider = ({ label, value, onChange, min, max, step = 1 }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step?: number }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase px-1">
            <span>{label}</span>
            <span className="text-[#A8D5D8]">{step >= 0.1 ? value.toFixed(1) : value}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#F5F3F0] rounded-full appearance-none cursor-pointer accent-[#A8D5D8]"
        />
    </div>
);

const CardGenerationModal: React.FC<CardGenerationModalProps> = ({ isOpen, onClose, settings, onSettingsChange, license, onUsageUpdate }) => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLogoGenerating, setIsLogoGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isColorSuiteGenerating, setIsColorSuiteGenerating] = useState(false);
    const [generatedBg, setGeneratedBg] = useState<string | null>(null);
    const [colorVariants, setColorVariants] = useState<string[]>([]);
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    const [activeSection, setActiveSection] = useState<'BRANDING' | 'EMPLOYEE' | 'VISUAL' | 'LAYOUT'>('BRANDING');
    const [zoom] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isMockupView, setIsMockupView] = useState(false);
    const [isPrintMasterOpen, setIsPrintMasterOpen] = useState(false);
    const [currentFullCanvasUrl, setCurrentFullCanvasUrl] = useState<string | null>(null);

    // Brand Hub state
    const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');

    // Batch / Persona State
    const [personas, setPersonas] = useState<Partial<CardData>[]>([]);
    const [activePersonaIndex, setActivePersonaIndex] = useState<number>(-1);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);
    const visionInputRef = useRef<HTMLInputElement>(null);

    // QR State
    const [qrMode, setQrMode] = useState<'LINK' | 'VCARD'>('VCARD');

    // Precision Engine Drag State
    const [dragTarget, setDragTarget] = useState<'text' | 'logo' | 'qr' | null>(null);
    const [dragAnchor, setDragAnchor] = useState({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 });

    const previewRef = useRef<HTMLDivElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const promptData = useCardPromptGenerator(settings);
    const { extractBrandData } = useVisionExtractor();

    // Canvas Constants
    const CANVAS_W = 3150;
    const CANVAS_H = 1800;
    const PREVIEW_W = 525;
    const PREVIEW_H = 300;
    const SCALE = CANVAS_W / PREVIEW_W; // 6.0
    const PADDING = 200;

    const brandPresets = [
        { name: 'Gold', color: '#D4AF37' },
        { name: 'Platinum', color: '#E5E4E2' },
        { name: 'Royal Blue', color: '#002366' },
        { name: 'Emerald', color: '#50C878' },
        { name: 'Sky', color: '#A8D5D8' },
        { name: 'Lavendar', color: '#D4C5E8' }
    ];

    const recommendedStyle = useMemo(() => {
        const desc = settings.cardData.companyDescription.toLowerCase();
        if (desc.match(/eco|green|nature|botanical|plant|organic/)) return 'ECO_BOTANICAL';
        if (desc.match(/tech|software|cyber|ai|digital|data/)) return 'TECH_CYBER';
        if (desc.match(/luxury|gold|diamond|premium|black|noir/)) return 'LUXURY_NOIR';
        if (desc.match(/swiss|minimal|modern|architecture|clean/)) return 'CORPORATE_SWISS';
        return null;
    }, [settings.cardData.companyDescription]);

    const activeQrData = useMemo(() => {
        if (qrMode === 'VCARD') return generateVCard(settings.cardData);
        return settings.cardData.qrCodeData;
    }, [qrMode, settings.cardData]);

    // --- Data Handlers ---

    useEffect(() => {
        if (isOpen) {
            getBrandKits().then(setBrandKits);
        }
    }, [isOpen]);

    const handleSaveBrand = async () => {
        // Convert Blob URL to base64 if needed before saving brand kit
        let logoImageToSave = settings.cardData.logoImage;
        if (logoImageToSave && logoImageToSave.startsWith('blob:')) {
            logoImageToSave = await blobUrlToBase64(logoImageToSave);
        }

        const kit: BrandKit = {
            id: Date.now().toString(),
            name: settings.cardData.company,
            company: settings.cardData.company,
            description: settings.cardData.companyDescription,
            slogan: settings.cardData.slogan,
            logoImage: logoImageToSave,
            accentColor: settings.cardData.accentColor,
            fontFamily: settings.cardData.fontFamily,
            timestamp: Date.now()
        };
        await saveBrandKit(kit);
        setBrandKits(await getBrandKits());
    };

    const handleLoadBrand = (kit: BrandKit) => {
        onSettingsChange({
            ...settings,
            cardData: {
                ...settings.cardData,
                company: kit.company,
                companyDescription: kit.description,
                slogan: kit.slogan,
                logoImage: kit.logoImage,
                accentColor: kit.accentColor,
                fontFamily: kit.fontFamily
            }
        });
        setSelectedBrandId(kit.id);
    };

    const handleDeleteBrand = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteBrandKit(id);
        setBrandKits(await getBrandKits());
        if (selectedBrandId === id) setSelectedBrandId('');
    };

    const handleDataChange = (field: keyof CardData, value: any) => {
        onSettingsChange({
            ...settings,
            cardData: { ...settings.cardData, [field]: value }
        });
    };

    const handleQuickAlign = (target: 'text' | 'logo' | 'qr', type: 'X' | 'Y' | 'BOTH') => {
        const updates: any = {};
        if (type === 'X' || type === 'BOTH') updates[`${target}OffsetX`] = 0;
        if (type === 'Y' || type === 'BOTH') updates[`${target}OffsetY`] = 0;
        
        onSettingsChange({
            ...settings,
            cardData: {
                ...settings.cardData,
                ...updates
            }
        });
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const newPersonas = parseCSV(text);
                if (newPersonas.length > 0) {
                    setPersonas(newPersonas);
                    applyPersona(0, newPersonas);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleVisionScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !license) return;

        setIsScanning(true); setStatusMessage(t('card.status.scanning')); setError(null);
        try {
            const deducted = await useLicenseCredit(license.key);
            if (!deducted) throw new Error("License limit reached.");

            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const base64 = await base64Promise;
            const extractedData = await extractBrandData(base64);
            
            if (extractedData) {
                onSettingsChange({
                    ...settings,
                    cardData: {
                        ...settings.cardData,
                        ...extractedData
                    }
                });
                setStatusMessage(t('card.vision.success'));
                setTimeout(() => setStatusMessage(''), 3000);
            }
            onUsageUpdate(license.usage.usedGenerations + 1);
        } catch (err: any) {
            setError(err.message || "Vision scan failed");
        } finally { setIsScanning(false); }
    };

    const applyPersona = (index: number, list: Partial<CardData>[] = personas) => {
        const persona = list[index];
        if (!persona) return;
        setActivePersonaIndex(index);
        
        onSettingsChange({
            ...settings,
            cardData: {
                ...settings.cardData,
                ...persona
            }
        });
    };

    const handleResetLayout = () => {
        onSettingsChange({
            ...settings,
            cardData: {
                ...settings.cardData,
                textOffsetX: 0, textOffsetY: 0, textScale: 1.0,
                logoOffsetX: 0, logoOffsetY: 0, logoScale: 1.0,
                qrOffsetX: 0, qrOffsetY: 0, qrScale: 1.0,
                letterSpacing: 0
            }
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => handleDataChange('logoImage', reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateLogo = async () => {
        if (!license) return;
        setIsLogoGenerating(true); setStatusMessage(t('card.status.logo')); setError(null);
        try {
            const deducted = await useLicenseCredit(license.key);
            if (!deducted) throw new Error("License limit reached.");
            
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const prompt = `Minimalist flat vector-style logo icon for a brand called "${settings.cardData.company}". Brand essence: ${settings.cardData.companyDescription}. Solid single color symbol on pure white background. Simple geometry, high contrast, clean lines, no text, no letters, just a symbol.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "1:1" } }
            });

            let logoBase64: string | null = null;
            for (const candidate of response.candidates || []) {
                for (const part of candidate.content?.parts || []) {
                    if (part.inlineData) { 
                        logoBase64 = `data:image/png;base64,${part.inlineData.data}`; 
                        break; 
                    }
                }
                if (logoBase64) break;
            }

            if (!logoBase64) throw new Error("Logo generation failed");
            // removeBackgroundClean returns a blob url now
            const transparentLogo = await removeBackgroundClean(logoBase64);
            handleDataChange('logoImage', transparentLogo);
            onUsageUpdate(license.usage.usedGenerations + 1);
        } catch (err: any) {
            setError(err.message || "Logo generation failed");
        } finally { setIsLogoGenerating(false); setStatusMessage(''); }
    };

    const handleGenerate = async () => {
        if (!license) return;
        setIsGenerating(true); setError(null); setStatusMessage(t('generator.processing'));
        setColorVariants([]);
        const cacheKey = `card_${settings.style}_${settings.modelTier}_${settings.cardData.companyDescription.slice(0, 50)}_${settings.cardData.showLogo && !settings.cardData.logoImage}`;
        try {
            let baseImage: string | null = null;
            const cached = await getCachedCardBg(cacheKey);
            if (cached) { 
                baseImage = cached; 
            } else {
                const deducted = await useLicenseCredit(license.key);
                if(!deducted) throw new Error("License limit reached or invalid.");
                
                const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
                const modelName = settings.modelTier === 'PRO' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
                const parts: any[] = [];
                if (promptData.metadata.systemInstruction) {
                    parts.push({ text: promptData.metadata.systemInstruction });
                }
                parts.push({ text: promptData.prompt });

                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts },
                    config: { imageConfig: { aspectRatio: "16:9" } }
                });
                
                for (const candidate of response.candidates || []) {
                    for (const part of candidate.content?.parts || []) {
                        if (part.inlineData) { 
                            baseImage = `data:image/png;base64,${part.inlineData.data}`; 
                            break; 
                        }
                    }
                    if (baseImage) break;
                }
                
                if (!baseImage) throw new Error("No image data returned from AI");
                setStatusMessage("🚀 " + t('upscaler.processing'));
                baseImage = await upscalerService.upscale(baseImage);
                // Cache takes blob url, converts to base64 internally if needed
                await saveCachedCardBg(cacheKey, baseImage);
                onUsageUpdate(license.usage.usedGenerations + 1);
            }

            // AUTO-CONTRAST ANALYSIS
            // getAverageBrightness can handle blob urls via Image()
            const brightness = await getAverageBrightness(baseImage);
            const isTextLight = brightness < 128;
            
            setGeneratedBg(baseImage);
            onSettingsChange({
                ...settings,
                cardData: {
                    ...settings.cardData,
                    isTextLight
                }
            });

        } catch (err: any) {
            if (err.message && err.message.includes("Requested entity was not found.")) {
                setError("Pro tier requires a paid API key. Please select one.");
                await (window as any).aistudio.openSelectKey();
            } else {
                setError(err.message || "Generation failed");
            }
        } finally { setIsGenerating(false); setStatusMessage(''); }
    };

    const handleGenerateColorSuite = async () => {
        if (!generatedBg) return;
        setIsColorSuiteGenerating(true);
        try {
            const offsets = [90, 180, 270];
            const variants = [generatedBg];
            for (const deg of offsets) {
                // applyHueRotation returns blob url
                const rot = await applyHueRotation(generatedBg, deg);
                variants.push(rot);
            }
            setColorVariants(variants);
        } catch (e) { console.error(e); } finally { setIsColorSuiteGenerating(false); }
    };

    // --- Canvas Helpers ---
    const drawIcon = (ctx: CanvasRenderingContext2D, type: 'phone' | 'email' | 'web' | 'location', x: number, y: number, size: number, color: string) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.translate(x, y);
        const s = size;
        
        switch (type) {
            case 'phone':
                ctx.beginPath();
                ctx.moveTo(s*0.2, s*0.1);
                ctx.lineTo(s*0.4, s*0.1); ctx.lineTo(s*0.5, s*0.3); ctx.lineTo(s*0.35, s*0.45);
                ctx.bezierCurveTo(s*0.4, s*0.55, s*0.5, s*0.65, s*0.6, s*0.7);
                ctx.lineTo(s*0.75, s*0.55); ctx.lineTo(s*0.9, s*0.65); ctx.lineTo(s*0.9, s*0.85);
                ctx.lineTo(s*0.7, s*0.95);
                ctx.bezierCurveTo(s*0.3, s*0.95, s*0.05, s*0.7, s*0.05, s*0.3);
                ctx.closePath();
                ctx.fill();
                break;
            case 'email':
                ctx.beginPath();
                ctx.roundRect(0, s*0.2, s, s*0.6, s*0.1);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = s*0.05;
                ctx.beginPath();
                ctx.moveTo(s*0.1, s*0.3); ctx.lineTo(s*0.5, s*0.6); ctx.lineTo(s*0.9, s*0.3);
                ctx.stroke();
                break;
            case 'web':
                ctx.beginPath();
                ctx.arc(s/2, s/2, s/2.2, 0, Math.PI*2);
                ctx.stroke();
                ctx.lineWidth = s*0.05;
                ctx.moveTo(s*0.1, s/2); ctx.lineTo(s*0.9, s/2);
                ctx.moveTo(s/2, s*0.1); ctx.lineTo(s/2, s*0.9);
                ctx.stroke();
                break;
            case 'location':
                ctx.beginPath();
                ctx.moveTo(s/2, s);
                ctx.bezierCurveTo(s, s*0.6, s, s*0.1, s/2, 0);
                ctx.bezierCurveTo(0, s*0.1, 0, s*0.6, s/2, s);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(s/2, s*0.3, s*0.15, 0, Math.PI*2); ctx.fill();
                break;
        }
        ctx.restore();
    };

    // --- Precision Drag Logic ---
    const handleDragStart = (e: React.MouseEvent, target: 'text' | 'logo' | 'qr') => {
        e.preventDefault();
        if (activeSide !== 'front') return;
        setDragTarget(target);
        
        let initialX = 0;
        let initialY = 0;
        if (target === 'text') { initialX = settings.cardData.textOffsetX; initialY = settings.cardData.textOffsetY; }
        else if (target === 'logo') { initialX = settings.cardData.logoOffsetX; initialY = settings.cardData.logoOffsetY; }
        else if (target === 'qr') { initialX = settings.cardData.qrOffsetX; initialY = settings.cardData.qrOffsetY; }
        
        setDragAnchor({ mouseX: e.clientX, mouseY: e.clientY, initialX, initialY });
    };

    const handleGlobalMouseMove = (e: React.MouseEvent) => {
        if (!dragTarget) return;
        
        // Calculate the absolute displacement from the anchor point
        const totalDx = (e.clientX - dragAnchor.mouseX) * SCALE / zoom;
        const totalDy = (e.clientY - dragAnchor.mouseY) * SCALE / zoom;
        
        const updates: any = {};
        if (dragTarget === 'text') { 
            updates.textOffsetX = dragAnchor.initialX + totalDx; 
            updates.textOffsetY = dragAnchor.initialY + totalDy; 
        }
        else if (dragTarget === 'logo') { 
            updates.logoOffsetX = dragAnchor.initialX + totalDx; 
            updates.logoOffsetY = dragAnchor.initialY + totalDy; 
        }
        else if (dragTarget === 'qr') { 
            updates.qrOffsetX = dragAnchor.initialX + totalDx; 
            updates.qrOffsetY = dragAnchor.initialY + totalDy; 
        }
        
        onSettingsChange({ ...settings, cardData: { ...settings.cardData, ...updates } });
    };

    const handleGlobalMouseUp = () => setDragTarget(null);

    // --- High-Res Drawing Logic ---
    const fetchQrCode = async (data: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data)}`;
        });
    };

    const generateCanvasForSide = async (side: 'front' | 'back', customBg?: string, customData?: CardData): Promise<string> => {
        const data = customData || settings.cardData;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false })!;
        canvas.width = CANVAS_W; canvas.height = CANVAS_H;
        const bgToUse = customBg || generatedBg;
        if (bgToUse) {
            const img = new Image(); img.src = bgToUse;
            await new Promise(r => img.onload = r);
            const imgRatio = img.width / img.height;
            const canvasRatio = CANVAS_W / CANVAS_H;
            let drawW, drawH, drawX, drawY;
            if (imgRatio > canvasRatio) { drawH = CANVAS_H; drawW = CANVAS_H * imgRatio; drawX = (CANVAS_W - drawW) / 2; drawY = 0; } 
            else { drawW = CANVAS_W; drawH = CANVAS_W / imgRatio; drawX = 0; drawY = (CANVAS_H - drawH) / 2; }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }

        const isLuxury = settings.style === 'LUXURY_NOIR';
        const isLight = data.isTextLight;
        const mainColor = isLuxury ? '#FFD700' : (isLight ? '#FFFFFF' : '#000000');
        const haloColor = isLuxury ? 'rgba(0,0,0,0.85)' : (isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)');
        const accentColor = data.accentColor;
        const activeFont = data.fontFamily || '"Inter", sans-serif';

        if (document.fonts) {
            const fontName = activeFont.replace(/"/g, '').split(',')[0];
            await document.fonts.load(`1em ${fontName}`);
        }

        const drawText = (text: string, x: number, y: number, fontSize: number, fontWeight: string = 'bold', align: CanvasTextAlign = 'left', colorOverride?: string) => {
            if (!text) return;
            ctx.save(); 
            ctx.textAlign = align; 
            ctx.font = `${fontWeight} ${fontSize * data.textScale}px ${activeFont}`;
            if ('letterSpacing' in ctx) { (ctx as any).letterSpacing = `${data.letterSpacing}px`; }
            ctx.shadowColor = haloColor; ctx.shadowBlur = 8; ctx.lineWidth = 10; ctx.strokeStyle = haloColor;
            ctx.strokeText(text, x + data.textOffsetX, y + data.textOffsetY); 
            ctx.fillStyle = colorOverride || mainColor; 
            ctx.fillText(text, x + data.textOffsetX, y + data.textOffsetY);
            ctx.restore();
        };

        if (side === 'front') {
            // DECOR: Accent Lines
            if (data.showDecor) {
                ctx.save();
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 15;
                ctx.globalAlpha = 0.9;
                if (settings.layout === 'VERTICAL') {
                    ctx.beginPath(); ctx.moveTo(CANVAS_W/2, 200); ctx.lineTo(CANVAS_W/2, CANVAS_H - 200); ctx.stroke();
                } else if (settings.layout === 'CLASSIC') {
                    ctx.beginPath(); ctx.moveTo(PADDING, 600); ctx.lineTo(PADDING + 450, 600); ctx.stroke();
                }
                ctx.restore();
            }

            // LOGO
            if (data.showLogo) {
                let ls = 600 * data.logoScale;
                let lx = settings.layout === 'VERTICAL' ? PADDING + 250 : settings.layout === 'CLASSIC' ? CANVAS_W - PADDING - 350 : CANVAS_W / 2;
                let ly = settings.layout === 'CENTER' ? 450 : settings.layout === 'VERTICAL' ? CANVAS_H / 2 - 200 : 450;
                lx += data.logoOffsetX;
                ly += data.logoOffsetY;

                if (data.logoImage) {
                    const logoImg = new Image(); logoImg.src = data.logoImage;
                    await new Promise(r => logoImg.onload = r);
                    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 40;
                    ctx.drawImage(logoImg, lx - ls / 2, ly - ls / 2, ls, ls); ctx.restore();
                } else {
                    ctx.save();
                    ctx.translate(lx, ly);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillStyle = accentColor;
                    ctx.shadowColor = 'rgba(0,0,0,0.2)';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(-ls/4, -ls/4, ls/2, ls/2);
                    ctx.strokeStyle = mainColor;
                    ctx.lineWidth = 10;
                    ctx.strokeRect(-ls/4, -ls/4, ls/2, ls/2);
                    ctx.restore();
                }
            }

            // QR
            if (data.showQrCode) {
                const personaQrData = qrMode === 'VCARD' ? generateVCard(data) : data.qrCodeData;
                const qrImg = await fetchQrCode(personaQrData);
                if (qrImg) {
                    let qs = 400 * data.qrScale;
                    let qx = settings.layout === 'CENTER' ? CANVAS_W / 2 - qs / 2 : settings.layout === 'VERTICAL' ? PADDING + 50 : CANVAS_W - PADDING - 200;
                    let qy = settings.layout === 'CENTER' ? CANVAS_H - PADDING - 300 : CANVAS_H - PADDING - 450;
                    qx += data.qrOffsetX; qy += data.qrOffsetY;
                    ctx.save(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(qx - 20, qy - 20, qs + 40, qs + 40); ctx.drawImage(qrImg, qx, qy, qs, qs); ctx.restore();
                }
            }
            // TEXT
            const labelColor = accentColor;
            if (settings.layout === 'CLASSIC') {
                drawText(data.name, PADDING, 350, 160, '900');
                drawText(data.position, PADDING, 480, 75, '700', 'left', labelColor);
                let curY = CANVAS_H - 600;
                drawIcon(ctx, 'phone', PADDING, curY - 50, 60, labelColor); drawText(data.phone, PADDING + 100, curY, 55, '600'); curY += 120;
                drawIcon(ctx, 'email', PADDING, curY - 50, 60, labelColor); drawText(data.email, PADDING + 100, curY, 55, '600'); curY += 120;
                drawIcon(ctx, 'location', PADDING, curY - 50, 60, labelColor); drawText(data.address, PADDING + 100, curY, 55, '600');
            } else if (settings.layout === 'CENTER') {
                drawText(data.name, CANVAS_W/2, CANVAS_H/2 - 150, 180, '900', 'center');
                drawText(data.position, CANVAS_W/2, CANVAS_H/2 + 20, 85, '700', 'center', labelColor);
                drawText(data.phone + '  |  ' + data.email, CANVAS_W/2, CANVAS_H - 350, 55, '600', 'center');
                drawText(data.website + '  |  ' + data.address, CANVAS_W/2, CANVAS_H - 250, 55, '600', 'center', labelColor);
            } else if (settings.layout === 'VERTICAL') {
                const cx = CANVAS_W/2 + 150;
                drawText(data.name, cx, 450, 170, '900');
                drawText(data.position, cx, 590, 80, '700', 'left', labelColor);
                let curY = 1000;
                drawIcon(ctx, 'phone', cx, curY - 45, 55, labelColor); drawText(data.phone, cx + 80, curY, 55, '600'); curY += 120;
                drawIcon(ctx, 'email', cx, curY - 45, 55, labelColor); drawText(data.email, cx + 80, curY, 55, '600'); curY += 120;
                drawIcon(ctx, 'web', cx, curY - 45, 55, labelColor); drawText(data.website, cx + 80, curY, 55, '600'); curY += 120;
                drawIcon(ctx, 'location', cx, curY - 45, 55, labelColor); drawText(data.address, cx + 80, curY, 55, '600');
            }
        } else {
            // BACK SIDE
            if (data.logoImage) {
                const logoImg = new Image(); logoImg.src = data.logoImage;
                await new Promise(r => logoImg.onload = r);
                const ls = 900; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 60;
                ctx.drawImage(logoImg, CANVAS_W/2 - ls/2, CANVAS_H/2 - ls/2 - 150, ls, ls); ctx.restore();
            }
            drawText(settings.cardData.company || '', CANVAS_W/2, CANVAS_H/2 + 450, 140, '900', 'center');
            drawText(settings.cardData.slogan || '', CANVAS_W/2, CANVAS_H/2 + 600, 65, '700', 'center', accentColor);
        }
        
        return new Promise((resolve) => {
            canvas.toBlob(blob => {
                 if (blob) resolve(URL.createObjectURL(blob));
            }, 'image/png');
        });
    };

    const handleDownload = async () => {
        if (!generatedBg) return;
        const frontUrl = await generateCanvasForSide('front');
        const l1 = document.createElement('a'); l1.download = `front-${Date.now()}.png`; l1.href = frontUrl; l1.click();
        
        // Revoke after download
        setTimeout(() => URL.revokeObjectURL(frontUrl), 1000);

        if (settings.cardData.showBackSide) {
            setTimeout(async () => {
                const backUrl = await generateCanvasForSide('back');
                const l2 = document.createElement('a'); l2.download = `back-${Date.now()}.png`; l2.href = backUrl; l2.click();
                setTimeout(() => URL.revokeObjectURL(backUrl), 1000);
            }, 600);
        }
    };

    const handleOpenPrintMaster = async () => {
        if (!generatedBg) return;
        setStatusMessage(t('print.status.generating'));
        const frontUrl = await generateCanvasForSide('front');
        setCurrentFullCanvasUrl(frontUrl);
        setIsPrintMasterOpen(true);
        setStatusMessage('');
    };

    const handleDownloadBatchZip = async () => {
        if (!generatedBg || personas.length === 0) return;
        setIsBatchProcessing(true); setStatusMessage(t('card.batch.processing'));
        try {
            const zip = new JSZip();
            for (let i = 0; i < personas.length; i++) {
                const p = { ...settings.cardData, ...personas[i] };
                const f = await generateCanvasForSide('front', generatedBg, p);
                const b = await generateCanvasForSide('back', generatedBg, p);
                const nameSlug = (p.name || `employee-${i+1}`).replace(/\s+/g, '_').toLowerCase();
                const folder = zip.folder(nameSlug);
                
                // Need to fetch blobs to zip them
                const fBlob = await (await fetch(f)).blob();
                const bBlob = await (await fetch(b)).blob();
                
                folder?.file('front.png', fBlob);
                folder?.file('back.png', bBlob);
                folder?.file('contact.vcf', generateVCard(p));
                
                URL.revokeObjectURL(f);
                URL.revokeObjectURL(b);
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `batch-${Date.now()}.zip`; link.click();
        } catch (e) { console.error(e); } finally { setIsBatchProcessing(false); setStatusMessage(''); }
    };

    const handleDownloadZip = async () => {
        if (colorVariants.length === 0) return;
        setIsGenerating(true); setStatusMessage(t('action.zipping'));
        try {
            const zip = new JSZip();
            for (let i = 0; i < colorVariants.length; i++) {
                const f = await generateCanvasForSide('front', colorVariants[i]);
                const b = await generateCanvasForSide('back', colorVariants[i]);
                
                const fBlob = await (await fetch(f)).blob();
                const bBlob = await (await fetch(b)).blob();

                zip.file(`card-${i+1}-front.png`, fBlob);
                zip.file(`card-${i+1}-back.png`, bBlob);
                
                URL.revokeObjectURL(f);
                URL.revokeObjectURL(b);
            }
            const blob = await zip.generateAsync({type: 'blob'});
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `suite-${Date.now()}.zip`; link.click();
        } catch (e) { console.error(e); } finally { setIsGenerating(false); setStatusMessage(''); }
    };

    // Preview Position helpers (Refined for Precision)
    const getBasePos = (target: 'text' | 'logo' | 'qr') => {
        if (target === 'logo') {
            const size = (600 * settings.cardData.logoScale) / SCALE;
            let lx = settings.layout === 'VERTICAL' ? PADDING + 250 : settings.layout === 'CLASSIC' ? CANVAS_W - PADDING - 350 : CANVAS_W / 2;
            let ly = settings.layout === 'CENTER' ? 450 : settings.layout === 'VERTICAL' ? CANVAS_H / 2 - 200 : 450;
            return { x: lx / SCALE - size / 2, y: ly / SCALE - size / 2, size };
        }
        if (target === 'qr') {
            const size = (400 * settings.cardData.qrScale) / SCALE;
            let qx = settings.layout === 'CENTER' ? CANVAS_W / 2 - (400 * settings.cardData.qrScale) / 2 : settings.layout === 'VERTICAL' ? PADDING + 50 : CANVAS_W - PADDING - 200;
            let qy = settings.layout === 'CENTER' ? CANVAS_H - PADDING - 300 : CANVAS_H - PADDING - 450;
            return { x: qx / SCALE, y: qy / SCALE, size };
        }
        return { x: 0, y: 0, size: 0 };
    };

    const textColorClass = settings.cardData.isTextLight ? 'text-white' : 'text-slate-900';

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-[#5A5A5A]/30 backdrop-blur-sm z-[110] flex items-center justify-center transition-all p-4"
            onClick={onClose}
        >
            <PrintMasterModal 
                isOpen={isPrintMasterOpen} 
                onClose={() => setIsPrintMasterOpen(false)} 
                // Fix: changed imageSource to initialImages array
                initialImages={currentFullCanvasUrl ? [currentFullCanvasUrl] : []} 
            />

            <div 
                className="w-full h-full md:h-[95vh] md:max-w-[1400px] md:rounded-3xl bg-[#F5F3F0] shadow-2xl flex flex-col overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <header className="h-14 bg-white border-b border-[#E8E3DC] flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📇</span>
                        <h1 className="font-bold text-[#5A5A5A] uppercase tracking-wider">{t('card.generator.title')}</h1>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <aside className={`absolute md:relative inset-0 md:inset-auto z-20 md:z-0 w-full md:w-[380px] bg-[#FEFCFB] border-r border-[#E8E3DC] flex flex-col`}>
                        <div className="flex-1 overflow-y-auto pastel-scroll">
                            <LadderSection label={t('card.category.branding')} icon="🏢" active={activeSection === 'BRANDING'} onClick={() => setActiveSection('BRANDING')}>
                                <div className="space-y-4">
                                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-3">
                                        <h4 className="text-[10px] font-black text-sky-800 uppercase tracking-widest flex items-center gap-2">
                                            <span>🗂️</span> {t('card.brand.hub')}
                                        </h4>
                                        
                                        <div className="space-y-2">
                                            {brandKits.length > 0 ? (
                                                <select 
                                                    value={selectedBrandId} 
                                                    onChange={(e) => {
                                                        const kit = brandKits.find(k => k.id === e.target.value);
                                                        if (kit) handleLoadBrand(kit);
                                                    }}
                                                    className="w-full p-2 bg-white border border-sky-200 rounded-xl text-xs outline-none"
                                                >
                                                    <option value="">{t('card.brand.load')}</option>
                                                    {brandKits.map(k => (
                                                        <option key={k.id} value={k.id}>{k.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-[10px] text-sky-600 font-bold">{t('card.brand.empty')}</p>
                                            )}
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={handleSaveBrand}
                                                    className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-sky-700 transition-colors"
                                                >
                                                    {t('card.brand.save')}
                                                </button>
                                                {selectedBrandId && (
                                                    <button 
                                                        onClick={(e) => handleDeleteBrand(e, selectedBrandId)}
                                                        className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-[10px] font-bold hover:bg-red-50 transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <button 
                                            onClick={() => visionInputRef.current?.click()}
                                            className="w-full py-3 bg-white border border-indigo-200 rounded-xl text-[10px] font-black uppercase text-indigo-700 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            👁️ {t('card.action.visionScan')}
                                        </button>
                                        <input type="file" ref={visionInputRef} onChange={handleVisionScan} accept="image/*" className="hidden" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.company')}</label>
                                        <input type="text" value={settings.cardData.company} onChange={(e) => handleDataChange('company', e.target.value)} className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-sm focus:border-[#A8D5D8] outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.accent')}</label>
                                        <div className="grid grid-cols-6 gap-1 mb-2">
                                            {brandPresets.map(p => (
                                                <button key={p.name} onClick={() => handleDataChange('accentColor', p.color)} className="aspect-square rounded-lg border border-white shadow-sm" style={{ backgroundColor: p.color }} />
                                            ))}
                                        </div>
                                        <ColorPickerControl color={settings.cardData.accentColor} onChange={(c) => handleDataChange('accentColor', c)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.description')}</label>
                                        <textarea value={settings.cardData.companyDescription} onChange={(e) => handleDataChange('companyDescription', e.target.value)} className="w-full h-24 p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-xs focus:border-[#A8D5D8] outline-none resize-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.logo')}</label>
                                        <div className="flex gap-2">
                                            <div onClick={() => logoInputRef.current?.click()} className="flex-1 h-20 bg-[#FAFAF8] border-2 border-dashed border-[#E8E3DC] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#A8D5D8] overflow-hidden group relative">
                                                {settings.cardData.logoImage ? <img src={settings.cardData.logoImage} className="h-full object-contain p-2" alt="Logo" /> : <span className="text-[10px] text-slate-400 font-bold uppercase">{t('action.upload')}</span>}
                                                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                            </div>
                                            <button 
                                                onClick={handleGenerateLogo} 
                                                disabled={isLogoGenerating}
                                                className={`flex-1 h-20 rounded-xl border-2 border-[#D4C5E8] flex flex-col items-center justify-center gap-1 transition-all hover:bg-purple-50 ${isLogoGenerating ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                {isLogoGenerating ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div> : <span className="text-xl">🪄</span>}
                                                <span className="text-[9px] font-black uppercase text-purple-600 tracking-tighter">{t('card.action.generateLogo')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </LadderSection>

                            <LadderSection label={t('card.category.employee')} icon="👤" active={activeSection === 'EMPLOYEE'} onClick={() => setActiveSection('EMPLOYEE')}>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => csvInputRef.current?.click()} 
                                            className="flex-1 py-2 px-3 bg-sky-50 border border-sky-200 rounded-xl text-[10px] font-black uppercase text-sky-700 hover:bg-sky-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            📥 {t('card.batch.import')}
                                        </button>
                                        <input type="file" ref={csvInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
                                        
                                        {personas.length > 0 && (
                                            <button 
                                                onClick={() => { setPersonas([]); setActivePersonaIndex(-1); }} 
                                                className="py-2 px-3 border border-red-100 rounded-xl text-[10px] font-black uppercase text-red-400 hover:bg-red-50 transition-all"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>

                                    {personas.length > 0 && (
                                        <div className="space-y-2 animate-fade-in">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{t('card.batch.count', { count: personas.length.toString() })}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-[#FAFAF8] custom-scrollbar">
                                                {personas.map((p, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => applyPersona(idx)}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${activePersonaIndex === idx ? 'bg-[#A8D5D8] border-[#94C9CC] text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {p.name || `Persona ${idx+1}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <hr className="border-[#E8E3DC]" />

                                    <div className="space-y-3">
                                        {[
                                            { id: 'name', label: t('card.field.name') },
                                            { id: 'position', label: t('card.field.position') },
                                            { id: 'phone', label: t('card.field.phone') },
                                            { id: 'email', label: t('card.field.email') },
                                            { id: 'website', label: t('card.field.website') },
                                            { id: 'address', label: t('card.field.address') },
                                            { id: 'telegram', label: t('card.field.telegram') },
                                            { id: 'instagram', label: t('card.field.instagram') },
                                            { id: 'whatsapp', label: t('card.field.whatsapp') }
                                        ].map(f => (
                                            <div key={f.id}>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{f.label}</label>
                                                <input type="text" value={(settings.cardData as any)[f.id]} onChange={(e) => handleDataChange(f.id as any, e.target.value)} className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-sm focus:border-[#A8D5D8] outline-none" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </LadderSection>

                            <LadderSection label={t('card.category.visual')} icon="🎨" active={activeSection === 'VISUAL'} onClick={() => setActiveSection('VISUAL')}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['CORPORATE_SWISS', 'LUXURY_NOIR', 'TECH_CYBER', 'ECO_BOTANICAL'] as CardStyleKey[]).map(s => (
                                            <button key={s} onClick={() => onSettingsChange({ ...settings, style: s })} 
                                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${settings.style === s ? 'border-[#A8D5D8] bg-[#FAFAF8] shadow-md' : 'border-slate-100 hover:border-slate-200'} ${recommendedStyle === s && settings.style !== s ? 'ring-2 ring-purple-300' : ''}`}>
                                                <span className="text-2xl">{CARD_STYLE_LIBRARY[s].emoji}</span>
                                                <span className="text-[9px] font-black uppercase text-slate-600 text-center leading-tight">{t(CARD_STYLE_LIBRARY[s].nameKey)}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <CosmicToggle label={t('card.field.contrast')} checked={settings.cardData.isTextLight} onChange={(v) => handleDataChange('isTextLight', v)} />
                                    <button onClick={handleGenerateColorSuite} disabled={!generatedBg || isColorSuiteGenerating} className={`w-full py-3 rounded-xl text-xs font-bold uppercase border-2 transition-all flex items-center justify-center gap-2 ${isColorSuiteGenerating ? 'bg-slate-50' : 'bg-white border-[#D4C5E8] text-[#5A5A5A] hover:bg-[#F5F3F0]'}`}>
                                        🎨 {isColorSuiteGenerating ? t('generator.processing') : t('card.action.colorSuite')}
                                    </button>
                                </div>
                            </LadderSection>

                            <LadderSection label={t('card.category.layout')} icon="📐" active={activeSection === 'LAYOUT'} onClick={() => setActiveSection('LAYOUT')}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'CLASSIC', label: t('card.layout.classic'), icon: '📐' },
                                            { id: 'CENTER', label: t('card.layout.center'), icon: '🎯' },
                                            { id: 'VERTICAL', label: t('card.layout.vertical'), icon: '📑' }
                                        ].map(l => (
                                            <button key={l.id} onClick={() => onSettingsChange({ ...settings, layout: l.id as CardLayout })}
                                                className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${settings.layout === l.id ? 'border-[#A8D5D8] bg-[#FAFAF8] shadow-sm' : 'border-slate-50 hover:border-slate-100'}`}>
                                                <span className="text-xl">{l.icon}</span>
                                                <span className="text-[9px] font-bold uppercase text-slate-500">{l.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.font')}</label>
                                            <select 
                                                value={settings.cardData.fontFamily} 
                                                onChange={(e) => handleDataChange('fontFamily', e.target.value)}
                                                className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-sm focus:border-[#A8D5D8] outline-none"
                                            >
                                                {CARD_FONTS.map(f => (
                                                    <option key={f.name} value={f.family}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <CosmicToggle label={t('card.toggle.backside')} checked={settings.cardData.showBackSide} onChange={(v) => handleDataChange('showBackSide', v)} />
                                        <CosmicToggle label={t('card.toggle.logo')} checked={settings.cardData.showLogo} onChange={(v) => handleDataChange('showLogo', v)} />
                                        <CosmicToggle label={t('card.toggle.qr')} checked={settings.cardData.showQrCode} onChange={(v) => handleDataChange('showQrCode', v)} />
                                        <CosmicToggle label={t('card.toggle.social')} checked={settings.cardData.showSocial} onChange={(v) => handleDataChange('showSocial', v)} />
                                        <CosmicToggle label={t('card.toggle.decor')} checked={settings.cardData.showDecor} onChange={(v) => handleDataChange('showDecor', v)} />
                                    </div>

                                    {settings.cardData.showQrCode && (
                                        <div className="space-y-2 animate-fade-in">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('card.field.qrMode')}</label>
                                            <OptionSelector 
                                                name="qrMode"
                                                value={qrMode}
                                                onChange={setQrMode}
                                                options={[
                                                    { value: 'VCARD', label: t('card.qrMode.vcard') },
                                                    { value: 'LINK', label: t('card.qrMode.link') }
                                                ]}
                                            />
                                            {qrMode === 'LINK' && (
                                                 <input type="text" value={settings.cardData.qrCodeData} onChange={(e) => handleDataChange('qrCodeData', e.target.value)} placeholder="https://..." className="w-full p-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-xs focus:border-[#A8D5D8] outline-none" />
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="pt-4 border-t border-[#E8E3DC] space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">📏 {t('card.offset.title')}</h3>
                                            <button onClick={handleResetLayout} className="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase transition-colors">{t('card.action.resetLayout')}</button>
                                        </div>
                                        
                                        {/* TEXT ALIGN */}
                                        <div className="space-y-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E8E3DC]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase text-slate-400">📝 {t('card.field.name')}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleQuickAlign('text', 'BOTH')} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[8px] font-bold uppercase">{t('card.action.alignCenter')}</button>
                                                </div>
                                            </div>
                                            <OffsetSlider label={t('card.offset.textScale')} value={settings.cardData.textScale} min={0.5} max={2.0} step={0.1} onChange={(v) => handleDataChange('textScale', v)} />
                                            <OffsetSlider label={t('card.offset.letterSpacing')} value={settings.cardData.letterSpacing} min={-2} max={15} step={1} onChange={(v) => handleDataChange('letterSpacing', v)} />
                                        </div>

                                        {/* LOGO ALIGN */}
                                        {settings.cardData.showLogo && (
                                            <div className="space-y-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E8E3DC]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">🖼️ {t('card.toggle.logo')}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleQuickAlign('logo', 'BOTH')} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[8px] font-bold uppercase">{t('card.action.alignCenter')}</button>
                                                    </div>
                                                </div>
                                                <OffsetSlider label={t('card.offset.logoScale')} value={settings.cardData.logoScale} min={0.2} max={2.5} step={0.1} onChange={(v) => handleDataChange('logoScale', v)} />
                                            </div>
                                        )}

                                        {/* QR ALIGN */}
                                        {settings.cardData.showQrCode && (
                                            <div className="space-y-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E8E3DC]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">🏁 {t('card.toggle.qr')}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleQuickAlign('qr', 'BOTH')} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-[8px] font-bold uppercase">{t('card.action.alignCenter')}</button>
                                                    </div>
                                                </div>
                                                <OffsetSlider label={t('card.offset.qrScale')} value={settings.cardData.qrScale} min={0.5} max={2.0} step={0.1} onChange={(v) => handleDataChange('qrScale', v)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </LadderSection>
                        </div>
                    </aside>

                    <main className="flex-1 bg-[#F5F3F0] p-12 flex flex-col items-center justify-center overflow-auto relative" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp} onMouseLeave={handleGlobalMouseUp}>
                        <div className="mb-6 flex items-center gap-4 z-20">
                            <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-white shadow-xl">
                                <button onClick={() => setActiveSide('front')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSide === 'front' ? 'bg-[#A8D5D8] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('card.side.front')}</button>
                                <button onClick={() => setActiveSide('back')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSide === 'back' ? 'bg-[#A8D5D8] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('card.side.back')}</button>
                            </div>
                            
                            <button 
                                onClick={() => setIsMockupView(!isMockupView)}
                                className={`p-3 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${isMockupView ? 'bg-[#5A5A5A] text-white border-[#5A5A5A]' : 'bg-white text-[#5A5A5A] border-white shadow-lg'}`}
                            >
                                🎥 {t('card.toggle.mockup')}
                            </button>
                        </div>

                        <div 
                            ref={previewRef} 
                            className={`relative shadow-2xl transition-all duration-700 group overflow-hidden border border-white/10 ${dragTarget ? 'cursor-grabbing' : 'cursor-default'} ${isScanning ? 'pointer-events-none' : ''}`} 
                            style={{ 
                                width: `${PREVIEW_W * zoom}px`, 
                                height: `${PREVIEW_H * zoom}px`, 
                                borderRadius: `${12 * zoom}px`,
                                transform: isMockupView 
                                    ? `perspective(1200px) rotateY(15deg) rotateX(8deg) scale(0.85) translateZ(50px)` 
                                    : `none`,
                                boxShadow: isMockupView 
                                    ? `-30px 40px 60px -20px rgba(0,0,0,0.3)` 
                                    : `0 20px 50px -10px rgba(0,0,0,0.15)`
                            }}
                        >
                            {/* BLEED AND SAFETY GUIDES */}
                            {!isMockupView && (
                                <>
                                    <div className="absolute inset-0 border-[6px] border-red-500/20 z-30 pointer-events-none rounded-sm">
                                        <div className="absolute -top-6 left-0 text-[7px] font-bold text-red-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{t('card.labels.bleed')}</div>
                                    </div>
                                    <div className="absolute inset-[33px] border border-dashed border-sky-400/30 z-30 pointer-events-none rounded-sm">
                                        <div className="absolute -bottom-6 right-0 text-[7px] font-bold text-sky-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{t('card.labels.safeZone')}</div>
                                    </div>
                                </>
                            )}
                            
                            <div className="absolute inset-0 bg-white">
                                {generatedBg ? <img src={generatedBg} className="w-full h-full object-cover animate-fade-in" alt="Background" /> : <div className="w-full h-full flex items-center justify-center bg-slate-200/20 text-slate-300"><span className="text-4xl">🎨</span></div>}
                            </div>

                            <div 
                                className={`absolute inset-0 z-10 transition-colors duration-500 ${textColorClass}`}
                                style={{ 
                                    fontFamily: settings.cardData.fontFamily, 
                                    letterSpacing: `${settings.cardData.letterSpacing / SCALE}px`,
                                    padding: `${PADDING / SCALE}px` 
                                }}
                            >
                                {activeSide === 'front' ? (
                                    <div className="relative w-full h-full pointer-events-none">
                                        {/* DECOR LINES PREVIEW */}
                                        {settings.cardData.showDecor && (
                                            <div 
                                                className="absolute z-10 pointer-events-none transition-all duration-500" 
                                                style={{ 
                                                    backgroundColor: settings.cardData.accentColor,
                                                    ...(settings.layout === 'VERTICAL' ? {
                                                        width: '2px', height: '80%', left: '50%', top: '10%', transform: 'translateX(-50%)'
                                                    } : {
                                                        height: '2px', width: '20%', left: '0', top: `${(600 - 350) / SCALE}px`
                                                    })
                                                }} 
                                            />
                                        )}

                                        {/* Logo Layer */}
                                        {settings.cardData.showLogo && (() => {
                                            const { x, y, size } = getBasePos('logo');
                                            return (
                                                <div 
                                                    onMouseDown={(e) => handleDragStart(e, 'logo')}
                                                    className="absolute z-40 cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-[#A8D5D8]/50 rounded-lg transition-colors p-1 flex items-center justify-center pointer-events-auto"
                                                    style={{ width: `${size * zoom}px`, height: `${size * zoom}px`, left: `${(x + settings.cardData.logoOffsetX / SCALE) * zoom}px`, top: `${(y + settings.cardData.logoOffsetY / SCALE) * zoom}px` }}
                                                >
                                                    {settings.cardData.logoImage ? (
                                                        <img src={settings.cardData.logoImage} className="max-w-full max-h-full object-contain pointer-events-none" alt="Logo" />
                                                    ) : (
                                                        <div className="w-full h-full border-4 border-current flex items-center justify-center" style={{ color: settings.cardData.accentColor, borderRadius: '50%', transform: 'rotate(45deg)' }}>
                                                            <div className="w-4/5 h-4/5 border-2 border-current rounded-sm"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* QR Layer */}
                                        {settings.cardData.showQrCode && (() => {
                                            const { x, y, size } = getBasePos('qr');
                                            return (
                                                <div 
                                                    onMouseDown={(e) => handleDragStart(e, 'qr')}
                                                    className="absolute z-40 cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-[#A8D5D8]/50 bg-white p-1 shadow-sm rounded transition-colors pointer-events-auto"
                                                    style={{ width: `${size * zoom}px`, height: `${size * zoom}px`, left: `${(x + settings.cardData.qrOffsetX / SCALE) * zoom}px`, top: `${(y + settings.cardData.qrOffsetY / SCALE) * zoom}px` }}
                                                >
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(activeQrData)}`} className="w-full h-full pointer-events-none" alt="QR" />
                                                </div>
                                            );
                                        })()}

                                        {/* Text Layer */}
                                        <div 
                                            onMouseDown={(e) => handleDragStart(e, 'text')}
                                            className={`absolute inset-0 z-20 flex flex-col border-2 border-transparent hover:border-[#A8D5D8]/30 rounded-xl transition-colors cursor-grab active:cursor-grabbing pointer-events-auto ${settings.layout === 'CENTER' ? 'items-center text-center' : 'items-start'}`}
                                            style={{ 
                                                transform: `translate(${(settings.cardData.textOffsetX / SCALE) * zoom}px, ${(settings.cardData.textOffsetY / SCALE) * zoom}px)`,
                                            }}
                                        >
                                            <div className="pointer-events-none" style={{ 
                                                marginTop: `${(settings.layout === 'CENTER' ? (CANVAS_H/2 - 150 - 350) : settings.layout === 'VERTICAL' ? (450 - 350) : 0) / SCALE * zoom}px`,
                                                marginLeft: `${(settings.layout === 'VERTICAL' ? 150 : 0) / SCALE * zoom}px`
                                            }}>
                                                <h2 className="font-black leading-tight tracking-tight" style={{ fontSize: `${(settings.layout === 'CENTER' ? 180 : 160) / SCALE * zoom * settings.cardData.textScale}px` }}>{settings.cardData.name}</h2>
                                                <p className="font-black opacity-80 uppercase tracking-widest" style={{ fontSize: `${(settings.layout === 'CENTER' ? 85 : 75) / SCALE * zoom * settings.cardData.textScale}px`, color: settings.cardData.accentColor }}>{settings.cardData.position}</p>
                                            </div>

                                            <div className="pointer-events-none" style={{ 
                                                marginTop: 'auto', 
                                                marginBottom: `${(settings.layout === 'CENTER' ? 0 : 0) * zoom}px`,
                                                marginLeft: `${(settings.layout === 'VERTICAL' ? 150 : 0) / SCALE * zoom}px`,
                                                fontSize: `${55 / SCALE * zoom * settings.cardData.textScale}px`,
                                                fontWeight: 800
                                            }}>
                                                <p className="flex items-center gap-2"><span className="w-3 h-3 bg-current opacity-40 inline-block rounded-sm" /> {settings.cardData.phone}</p>
                                                <p className="flex items-center gap-2"><span className="w-3 h-3 bg-current opacity-40 inline-block rounded-sm" /> {settings.cardData.email}</p>
                                                <p className="flex items-center gap-2"><span className="w-3 h-3 bg-current opacity-40 inline-block rounded-sm" /> {settings.cardData.address}</p>
                                                {settings.cardData.showSocial && (
                                                    <div className={`pt-2 flex gap-3 ${settings.layout === 'CENTER' ? 'justify-center' : ''}`}>
                                                        {settings.cardData.telegram && <span className="opacity-90">✈️ {settings.cardData.telegram}</span>}
                                                        {settings.cardData.instagram && <span className="opacity-90">📸 {settings.cardData.instagram}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                                        {settings.cardData.logoImage ? (
                                             <img src={settings.cardData.logoImage} style={{ maxWidth: `${180 * zoom}px`, maxHeight: `${180 * zoom}px`, objectFit: 'contain' }} className="mb-4 filter drop-shadow-2xl" alt="Logo" />
                                        ) : (
                                            <div className="text-4xl mb-4" style={{ color: settings.cardData.accentColor }}>✦</div>
                                        )}
                                        <h2 className="font-black uppercase tracking-widest mb-1" style={{ fontSize: `${20 * zoom}px` }}>{settings.cardData.company}</h2>
                                        <p className="font-bold opacity-80 uppercase tracking-[0.2em]" style={{ fontSize: `${10 * zoom}px`, color: settings.cardData.accentColor }}>{settings.cardData.slogan}</p>
                                    </div>
                                )}
                            </div>

                            {/* VISION SCAN OVERLAY */}
                            {isScanning && (
                                <div className="absolute inset-0 z-[100] bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center overflow-hidden rounded-xl">
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-scanner-bar opacity-80" />
                                    </div>
                                    <div className="bg-white/90 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">{t('card.status.scanning')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(isGenerating || isLogoGenerating || isBatchProcessing) && (
                            <div className="absolute inset-0 bg-[#F5F3F0]/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#A8D5D8] border-t-transparent rounded-full animate-spin"></div>
                                <p className="font-black text-xs text-[#5A5A5A] uppercase tracking-widest animate-pulse">{statusMessage || t('generator.processing')}</p>
                            </div>
                        )}
                    </main>

                    <aside className="w-full md:w-[320px] bg-white border-l border-[#E8E3DC] p-6 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
                        
                        <SparkleButton 
                            onClick={handleGenerate} 
                            disabled={isGenerating || isLogoGenerating}
                            isProcessing={isGenerating || isLogoGenerating}
                        >
                            { '✨ ' + t('generator.button')}
                        </SparkleButton>
                        
                        <div className="mt-auto space-y-3">
                            {error && <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>}
                            
                            <button 
                                onClick={handleOpenPrintMaster} 
                                disabled={!generatedBg} 
                                className={`w-full py-4 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${!generatedBg ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#5A5A5A] hover:bg-[#4A4A4A]'}`}
                            >
                                <span>🖨️</span> {t('dashboard.print')}
                            </button>

                            {personas.length > 0 ? (
                                <button onClick={handleDownloadBatchZip} disabled={!generatedBg || isBatchProcessing} className={`w-full py-4 rounded-xl text-slate-800 font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${!generatedBg || isBatchProcessing ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#A8D5D8] hover:bg-[#94C9CC]'}`}>
                                    <span>📦</span> {t('card.action.downloadBatchZip')}
                                </button>
                            ) : (
                                <button onClick={handleDownload} disabled={!generatedBg} className={`w-full py-4 rounded-xl text-slate-800 font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${!generatedBg ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#D4C5E8] hover:bg-[#C9BBDE]'}`}>
                                    <span>⬇️</span> {t('action.downloadResult')}
                                </button>
                            )}

                            {colorVariants.length > 0 && (
                                <button onClick={handleDownloadZip} className="w-full py-3 rounded-xl bg-[#5A5A5A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4A4A4A] transition-all flex items-center justify-center gap-2">
                                    📦 {t('card.action.downloadAll')}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CardGenerationModal;
