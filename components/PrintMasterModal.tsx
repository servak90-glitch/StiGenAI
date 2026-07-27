
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { fabric } from 'fabric';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { STYLE_LIBRARY } from '../constants';
import { StyleKey } from '../types';

interface PrintMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialImages?: string[]; 
}

const PrintMasterModal: React.FC<PrintMasterModalProps> = ({ isOpen, onClose, initialImages = [] }) => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<StyleKey>('VIBRANT_DIGITAL_COMIC');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [status, setStatus] = useState('');

    // A4 Portrait 300DPI: ~2480 x 3508
    const SHEET_W = 2480;
    const SHEET_H = 3508;
    const SCALE = 0.25; // Preview scale

    useEffect(() => {
        if (isOpen && !fabricCanvasRef.current) {
            const canvas = new fabric.Canvas('print-canvas', {
                width: SHEET_W * SCALE,
                height: SHEET_H * SCALE,
                backgroundColor: '#FFFFFF',
                preserveObjectStacking: true
            });
            fabricCanvasRef.current = canvas;
            
            if (initialImages.length > 0) {
                addBatchToCanvas(initialImages);
            }
        } else if (isOpen && fabricCanvasRef.current && initialImages.length > 0) {
            addBatchToCanvas(initialImages);
        }

        return () => {
            if (!isOpen && fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, [isOpen]);

    const addBatchToCanvas = (images: string[]) => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        let startX = 20;
        let startY = 20;

        images.forEach((src, i) => {
            fabric.Image.fromURL(src, (img) => {
                img.set({
                    left: startX + (i % 3) * 150,
                    top: startY + Math.floor(i / 3) * 150,
                    scaleX: 120 / (img.width || 1),
                    scaleY: 120 / (img.height || 1),
                    cornerColor: '#A8D5D8',
                    cornerSize: 8,
                    transparentCorners: false,
                    borderColor: '#A8D5D8'
                });
                canvas.add(img);
                canvas.renderAll();
            }, { crossOrigin: 'anonymous' });
        });
    };

    const handleAddImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e: any) => {
            const files = Array.from(e.target.files || []);
            files.forEach((file: any) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (fabricCanvasRef.current) {
                        fabric.Image.fromURL(ev.target?.result as string, (img) => {
                            img.set({
                                left: 50, top: 50,
                                scaleX: 150 / (img.width || 1),
                                scaleY: 150 / (img.height || 1),
                                cornerColor: '#A8D5D8',
                                cornerSize: 10
                            });
                            fabricCanvasRef.current?.add(img);
                            fabricCanvasRef.current?.renderAll();
                        });
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        };
        input.click();
    };

    const handleDuplicate = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone((cloned: any) => {
            canvas.discardActiveObject();
            cloned.set({
                left: (active.left || 0) + 20,
                top: (active.top || 0) + 20,
                evented: true,
            });
            if (cloned.type === 'activeSelection') {
                cloned.canvas = canvas;
                cloned.forEachObject((obj: any) => canvas.add(obj));
                cloned.setCoords();
            } else {
                canvas.add(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
        });
    };

    const handleDelete = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    };

    const ensureApiKey = async () => {
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
            return true;
        } catch (e) {
            console.error("API Key selection failed", e);
            return false;
        }
    };

    const handleGenerateBackground = async () => {
        if (isGenerating) return;
        
        const keyReady = await ensureApiKey();
        if (!keyReady) return;

        setIsGenerating(true); 
        setStatus(t('print.status.bgGen'));
        try {
            const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
            const styleInfo = STYLE_LIBRARY[selectedStyle];
            const prompt = `Professional high-resolution abstract aesthetic background. Artistic composition, minimalist but expressive, based on this style code: ${styleInfo.strictPrompt}. NO TEXT. NO CHARACTERS. Large format artistic wallpaper suitable for print presentation.`;
            
            const resp = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "9:16", imageSize: "1K" } }
            });

            let bgSrc = null;
            if (resp.candidates) {
                for (const cand of resp.candidates) {
                    if (cand.content?.parts) {
                        for (const part of cand.content.parts) {
                            if (part.inlineData) { bgSrc = `data:image/png;base64,${part.inlineData.data}`; break; }
                        }
                    }
                    if (bgSrc) break;
                }
            }

            if (bgSrc && fabricCanvasRef.current) {
                fabric.Image.fromURL(bgSrc, (img) => {
                    const canvas = fabricCanvasRef.current;
                    if (!canvas) return;

                    // Scale to fill the entire A4 area
                    const scaleX = canvas.width! / (img.width || 1);
                    const scaleY = canvas.height! / (img.height || 1);
                    const scale = Math.max(scaleX, scaleY);

                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                        scaleX: scale,
                        scaleY: scale,
                        originX: 'left',
                        originY: 'top',
                        left: 0,
                        top: 0,
                        crossOrigin: 'anonymous'
                    });
                }, { crossOrigin: 'anonymous' });
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            setIsGenerating(false); 
            setStatus(''); 
        }
    };

    const handleExport = () => {
        if (!fabricCanvasRef.current) return;
        const dataUrl = fabricCanvasRef.current.toDataURL({
            format: 'png',
            multiplier: 4, // High-res 300DPI export
            quality: 1
        });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `print-ready-sheet-${Date.now()}.png`;
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-[#F5F3F0] w-full max-w-6xl h-[95vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-white/20">
                <header className="h-20 bg-white border-b border-[#E8E3DC] flex items-center justify-between px-10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">🖨️</span>
                        <h2 className="text-xl font-black text-[#5A5A5A] uppercase tracking-tighter">{t('print.interactive.title')}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition text-slate-300">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <aside className="w-72 bg-white border-r border-[#E8E3DC] p-6 flex flex-col gap-4 overflow-y-auto pastel-scroll">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('print.setup.title')}</h3>
                        
                        <button onClick={handleAddImage} className="w-full py-3 bg-sky-50 text-sky-700 rounded-2xl text-[10px] font-black uppercase hover:bg-sky-100 transition-all flex items-center justify-center gap-2">
                            ➕ {t('print.action.add')}
                        </button>

                        <hr className="border-[#E8E3DC]" />
                        
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Page Style</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(STYLE_LIBRARY).map((key) => {
                                    const style = STYLE_LIBRARY[key as StyleKey];
                                    return (
                                        <button 
                                            key={key} 
                                            onClick={() => setSelectedStyle(key as StyleKey)}
                                            className={`p-2 border rounded-xl text-left transition-all flex flex-col gap-1 items-center justify-center
                                            ${selectedStyle === key ? 'bg-sky-50 border-sky-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-sky-200'}`}
                                        >
                                            <span className="text-xl">{style.emoji}</span>
                                            <span className="text-[8px] font-bold uppercase text-slate-600 text-center leading-tight">{t(style.nameKey)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={handleGenerateBackground} disabled={isGenerating} className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                            🌈 {isGenerating ? status : t('print.action.bgGen')}
                        </button>

                        <hr className="border-[#E8E3DC]" />

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleDuplicate} className="py-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-[9px] font-bold uppercase text-slate-600 hover:border-sky-300 transition-all">👯 {t('print.tools.duplicate')}</button>
                            <button onClick={handleDelete} className="py-2 bg-[#FAFAF8] border border-[#E8E3DC] rounded-xl text-[9px] font-bold uppercase text-red-400 hover:border-red-300 transition-all">🗑️ {t('print.tools.delete')}</button>
                        </div>

                        <button onClick={() => { 
                            if(fabricCanvasRef.current) {
                                fabricCanvasRef.current.clear(); 
                                fabricCanvasRef.current.backgroundColor = '#FFFFFF';
                                fabricCanvasRef.current.renderAll();
                            }
                        }} className="w-full py-3 border border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase hover:bg-red-50 transition-all">
                            💥 {t('print.action.clear')}
                        </button>

                        <div className="mt-auto space-y-3">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">{t('print.paper.a4')}</p>
                            <button 
                                onClick={handleExport}
                                className="w-full py-5 rounded-3xl bg-[#5A5A5A] text-white font-black uppercase tracking-widest shadow-2xl hover:bg-[#4A4A4A] transition-all transform active:scale-95"
                            >
                                🚀 {t('print.action.export')}
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 bg-[#5A5A5A]/5 p-10 flex items-center justify-center overflow-auto custom-scrollbar">
                         <div ref={canvasContainerRef} className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] bg-white border border-white/50">
                             <canvas id="print-canvas" />
                         </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PrintMasterModal;
