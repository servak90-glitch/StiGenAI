import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { traceOutline, TRACER_PRESETS, TracerConfig, TracerPresetKey } from '../utils/svgTracer';
import { PreprocessConfig } from '../utils/smartTracer';
import { License } from '../types';
import SunLoader from './SunLoader';

interface ProcessorModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: License | null;
    onUsageUpdate?: (usage: number) => void;
    initialImage?: string | null;
}

type ViewMode = 'SVG' | 'SPLIT' | 'ORIGINAL' | 'OVERLAY';
type PresetType = 'COLOR_BALANCED' | 'HIGH_DETAIL' | 'SMOOTH_LOGO' | 'LINE_ART' | 'CUSTOM';
type CanvasBg = 'GRID' | 'WHITE' | 'DARK';

const triggerDownload = (url: string, filename: string, shouldRevoke: boolean = false) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (shouldRevoke && url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
};

const ProcessorModal: React.FC<ProcessorModalProps> = ({ isOpen, onClose, license: _license, initialImage }) => {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
    const [svgOutput, setSvgOutput] = useState<string | null>(null);
    const [isTracing, setIsTracing] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    // View & Zoom State
    const [viewMode, setViewMode] = useState<ViewMode>('SVG');
    const [canvasBg, setCanvasBg] = useState<CanvasBg>('GRID');
    const [zoom, setZoom] = useState<number>(100);
    const [splitPos, setSplitPos] = useState<number>(50); // percentage for split view

    // Vector Trace Parameters
    const [preset, setPreset] = useState<PresetType>('COLOR_BALANCED');
    const [numColors, setNumColors] = useState<number>(16);
    const [smoothness, setSmoothness] = useState<number>(1.0); // ltres & qtres
    const [despeckle, setDespeckle] = useState<number>(4); // pathomit
    const [contrast, setContrast] = useState<number>(1.0);
    const [blur, setBlur] = useState<number>(0);
    const [bwThreshold, setBwThreshold] = useState<number>(-1); // -1 means color, 0-255 means B&W
    const [optimizeSvg, setOptimizeSvg] = useState<boolean>(true);

    // SVG Metrics
    const [svgMetrics, setSvgMetrics] = useState<{ pathCount: number; sizeKb: string; executionTimeMs: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when initialImage changes or modal opens
    useEffect(() => {
        if (initialImage) {
            setSelectedImage(initialImage);
        }
    }, [initialImage, isOpen]);

    // Apply Preset defaults
    const applyPresetValues = (p: PresetType) => {
        setPreset(p);
        switch (p) {
            case 'COLOR_BALANCED':
                setNumColors(16);
                setSmoothness(1.0);
                setDespeckle(4);
                setContrast(1.0);
                setBlur(0);
                setBwThreshold(-1);
                break;
            case 'HIGH_DETAIL':
                setNumColors(32);
                setSmoothness(0.2);
                setDespeckle(1);
                setContrast(1.1);
                setBlur(0);
                setBwThreshold(-1);
                break;
            case 'SMOOTH_LOGO':
                setNumColors(8);
                setSmoothness(2.0);
                setDespeckle(12);
                setContrast(1.2);
                setBlur(0.5);
                setBwThreshold(-1);
                break;
            case 'LINE_ART':
                setNumColors(2);
                setSmoothness(0.5);
                setDespeckle(2);
                setContrast(1.5);
                setBlur(0);
                setBwThreshold(128);
                break;
            case 'CUSTOM':
                break;
        }
    };

    // Perform Tracing Function
    const performTracing = useCallback(async () => {
        if (!selectedImage) return;

        setIsTracing(true);
        setError(null);
        setStatusMessage(t('processor.status.tracing') || 'Векторизация изображения...');
        const startTime = performance.now();

        try {
            // Build TracerConfig
            let tracerPresetKey: TracerPresetKey = 'BALANCED';
            if (preset === 'HIGH_DETAIL') tracerPresetKey = 'HIGH_DETAIL';
            if (preset === 'SMOOTH_LOGO') tracerPresetKey = 'SMOOTHED';
            if (preset === 'LINE_ART') tracerPresetKey = 'TECHNICAL';

            const traceConfig: TracerConfig = {
                ...TRACER_PRESETS[tracerPresetKey],
                numberofcolors: bwThreshold >= 0 ? 2 : numColors,
                ltres: smoothness,
                qtres: smoothness,
                pathomit: despeckle,
                optimize: optimizeSvg,
                useVTracer: true
            };

            const preprocessConfig: PreprocessConfig = {
                blurRadius: blur,
                contrast: contrast,
                threshold: bwThreshold >= 0 ? bwThreshold : undefined
            };

            const resultSvg = await traceOutline(selectedImage, traceConfig, preprocessConfig);

            if (!resultSvg || resultSvg.length < 50) {
                throw new Error('Трассировка возвратила пустой SVG результат.');
            }

            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime);

            // Calculate SVG stats
            const matches = resultSvg.match(/<path|<polygon|<rect|<circle|<ellipse/g);
            const pathCount = matches ? matches.length : 0;
            const sizeKb = (new Blob([resultSvg]).size / 1024).toFixed(1);

            setSvgOutput(resultSvg);
            setSvgMetrics({
                pathCount,
                sizeKb,
                executionTimeMs: executionTime
            });
        } catch (err: any) {
            console.error('[Vectorization Studio] Error:', err);
            setError(err.message || 'Ошибка векторизации изображения.');
        } finally {
            setIsTracing(false);
            setStatusMessage('');
        }
    }, [selectedImage, preset, numColors, smoothness, despeckle, contrast, blur, bwThreshold, optimizeSvg, t]);

    // Auto trace on image upload or setting changes
    useEffect(() => {
        if (selectedImage && isOpen) {
            performTracing();
        } else {
            setSvgOutput(null);
            setSvgMetrics(null);
        }
    }, [selectedImage, isOpen, preset, numColors, smoothness, despeckle, contrast, blur, bwThreshold, optimizeSvg]);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const downloadSvgFile = () => {
        if (!svgOutput) return;
        const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `vectorized_${Date.now()}.svg`, true);
    };

    const downloadPngHighRes = () => {
        if (!svgOutput) return;
        const img = new Image();
        const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            const scale = 4; // High resolution 4x
            const canvas = document.createElement('canvas');
            canvas.width = (img.width || 1024) * scale;
            canvas.height = (img.height || 1024) * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const pngUrl = canvas.toDataURL('image/png');
                triggerDownload(pngUrl, `vectorized_4x_${Date.now()}.png`);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const copySvgToClipboard = () => {
        if (!svgOutput) return;
        navigator.clipboard.writeText(svgOutput).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 text-xl font-bold">
                            📐
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                Студия Векторизации
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                    VTracer Engine
                                </span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                Преобразование растровых изображений в чистый SVG вектор без ИИ
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedImage && (
                            <button
                                onClick={() => { setSelectedImage(null); setSvgOutput(null); }}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
                            >
                                ✕ Заменить фото
                            </button>
                        )}
                        <button 
                            onClick={onClose} 
                            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-2xl transition"
                            title="Закрыть"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Body Grid */}
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* Left Canvas Viewport */}
                    <div 
                        className="flex-grow lg:w-7/12 bg-slate-100 dark:bg-slate-950 flex flex-col relative overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800"
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {/* Canvas Toolbar */}
                        <div className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
                            {/* View Mode Switcher */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                                <button
                                    onClick={() => setViewMode('SVG')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'SVG' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    🎨 SVG Вектор
                                </button>
                                <button
                                    onClick={() => setViewMode('SPLIT')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'SPLIT' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    🌓 До / После
                                </button>
                                <button
                                    onClick={() => setViewMode('ORIGINAL')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'ORIGINAL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    🖼️ Растр
                                </button>
                            </div>

                            {/* Canvas Background & Zoom controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 text-xs">
                                    <button 
                                        onClick={() => setCanvasBg('GRID')} 
                                        title="Сетка прозрачности"
                                        className={`w-6 h-6 rounded-md font-bold flex items-center justify-center ${canvasBg === 'GRID' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        🏁
                                    </button>
                                    <button 
                                        onClick={() => setCanvasBg('WHITE')} 
                                        title="Белый фон"
                                        className={`w-6 h-6 rounded-md font-bold flex items-center justify-center ${canvasBg === 'WHITE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        ⬜
                                    </button>
                                    <button 
                                        onClick={() => setCanvasBg('DARK')} 
                                        title="Тёмный фон"
                                        className={`w-6 h-6 rounded-md font-bold flex items-center justify-center ${canvasBg === 'DARK' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
                                    >
                                        ⬛
                                    </button>
                                </div>

                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                                    <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="px-2 py-0.5 font-black hover:text-cyan-500 text-slate-600 dark:text-slate-300">-</button>
                                    <span className="px-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">{zoom}%</span>
                                    <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="px-2 py-0.5 font-black hover:text-cyan-500 text-slate-600 dark:text-slate-300">+</button>
                                    <button onClick={() => setZoom(100)} className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white">Сброс</button>
                                </div>
                            </div>
                        </div>

                        {/* Viewport Canvas Container */}
                        <div className="flex-grow flex items-center justify-center p-6 relative overflow-auto">
                            {!selectedImage ? (
                                <label className="flex flex-col items-center justify-center border-3 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-3xl cursor-pointer p-10 max-w-md text-center bg-white dark:bg-slate-900 shadow-sm transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                        📥
                                    </div>
                                    <span className="font-extrabold text-slate-800 dark:text-white text-base">
                                        Загрузите изображение для векторизации
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                        Перетащите файл сюда или нажмите для выбора (PNG, JPG, WebP)
                                    </span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload} 
                                    />
                                </label>
                            ) : (
                                <div 
                                    className={`relative max-w-full max-h-full flex items-center justify-center transition-all ${
                                        canvasBg === 'GRID' 
                                            ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]' 
                                            : canvasBg === 'WHITE' 
                                                ? 'bg-white' 
                                                : 'bg-slate-900'
                                    } p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner`}
                                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                                >
                                    {isTracing && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 rounded-2xl">
                                            <SunLoader className="w-8 h-8 text-cyan-600" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 animate-pulse">
                                                {statusMessage || 'Выполняется векторизация...'}
                                            </span>
                                        </div>
                                    )}

                                    {/* View Mode: SVG Only */}
                                    {viewMode === 'SVG' && svgOutput && (
                                        <div 
                                            className="max-w-full max-h-[60vh] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[60vh] [&>svg]:h-auto"
                                            dangerouslySetInnerHTML={{ __html: svgOutput }} 
                                        />
                                    )}

                                    {/* View Mode: Original Raster */}
                                    {viewMode === 'ORIGINAL' && (
                                        <img 
                                            src={selectedImage} 
                                            alt="Original raster" 
                                            className="max-w-full max-h-[60vh] object-contain rounded-lg" 
                                        />
                                    )}

                                    {/* View Mode: Split Comparison */}
                                    {viewMode === 'SPLIT' && (
                                        <div className="relative max-w-full max-h-[60vh] overflow-hidden rounded-lg flex items-center justify-center">
                                            {/* Original Image underneath */}
                                            <img 
                                                src={selectedImage} 
                                                alt="Original" 
                                                className="max-w-full max-h-[60vh] object-contain block" 
                                            />
                                            {/* SVG overlay clipped by split slider */}
                                            {svgOutput && (
                                                <div 
                                                    className="absolute inset-0 overflow-hidden flex items-center justify-center"
                                                    style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                                                >
                                                    <div 
                                                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[60vh] [&>svg]:h-auto"
                                                        dangerouslySetInnerHTML={{ __html: svgOutput }} 
                                                    />
                                                </div>
                                            )}
                                            {/* Split Slider Line */}
                                            <div 
                                                className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 z-20 cursor-ew-resize flex items-center justify-center"
                                                style={{ left: `${splitPos}%` }}
                                            >
                                                <div className="w-6 h-6 bg-cyan-500 rounded-full shadow-lg text-white flex items-center justify-center text-[10px] font-black">
                                                    ↔
                                                </div>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={splitPos} 
                                                onChange={e => setSplitPos(Number(e.target.value))}
                                                className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Metric Stats Bar */}
                        {svgMetrics && selectedImage && (
                            <div className="px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-4">
                                    <span>🧩 Контуров: <strong className="text-slate-900 dark:text-white">{svgMetrics.pathCount}</strong></span>
                                    <span>📦 Размер: <strong className="text-slate-900 dark:text-white">{svgMetrics.sizeKb} KB</strong></span>
                                    <span>⚡ Время: <strong className="text-slate-900 dark:text-white">{svgMetrics.executionTimeMs} ms</strong></span>
                                </div>
                                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">✓ Вектор готов к скачиванию</span>
                            </div>
                        )}
                    </div>

                    {/* Right Controls Sidebar */}
                    <div className="w-full lg:w-5/12 p-6 bg-white dark:bg-slate-900 overflow-y-auto flex flex-col justify-between space-y-6">
                        
                        <div className="space-y-6">
                            
                            {/* Preset Selection Grid */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                                    Пресеты векторизации
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'COLOR_BALANCED', label: '🎨 Цветной', desc: 'Сбалансированный цвет' },
                                        { key: 'HIGH_DETAIL', label: '💎 Высокая деталь', desc: '32 цвета, острые углы' },
                                        { key: 'SMOOTH_LOGO', label: '🌊 Плавный лого', desc: 'Для стикеров и логотипов' },
                                        { key: 'LINE_ART', label: '✒️ Ч/Б Контур', desc: '1-бит для лазерной резки' },
                                    ].map(item => (
                                        <button
                                            key={item.key}
                                            onClick={() => applyPresetValues(item.key as PresetType)}
                                            className={`p-3 rounded-2xl border text-left transition-all ${
                                                preset === item.key
                                                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-bold ring-2 ring-cyan-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{item.label}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{item.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fine-Tuning Parameters */}
                            <div className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Точная настройка
                                    </label>
                                    {preset !== 'CUSTOM' && (
                                        <button 
                                            onClick={() => setPreset('CUSTOM')} 
                                            className="text-[10px] font-bold text-cyan-600 hover:underline"
                                        >
                                            Кастомные настройки
                                        </button>
                                    )}
                                </div>

                                {/* Colors Slider */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        <span>Количество цветов</span>
                                        <span className="text-cyan-600 dark:text-cyan-400">{bwThreshold >= 0 ? '2 (Ч/Б)' : `${numColors} цв.`}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="2"
                                        max="64"
                                        step="2"
                                        disabled={bwThreshold >= 0}
                                        value={numColors}
                                        onChange={e => { setNumColors(Number(e.target.value)); setPreset('CUSTOM'); }}
                                        className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
                                    />
                                </div>

                                {/* Smoothness Slider */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        <span>Плавность линий (Сглаживание)</span>
                                        <span className="text-cyan-600 dark:text-cyan-400">{smoothness.toFixed(1)}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0.1"
                                        max="4.0"
                                        step="0.1"
                                        value={smoothness}
                                        onChange={e => { setSmoothness(Number(e.target.value)); setPreset('CUSTOM'); }}
                                        className="w-full accent-cyan-500 cursor-pointer"
                                    />
                                </div>

                                {/* Despeckle Noise Filter */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        <span>Фильтр мелкого шума (Despeckle)</span>
                                        <span className="text-cyan-600 dark:text-cyan-400">{despeckle} px</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="32"
                                        step="1"
                                        value={despeckle}
                                        onChange={e => { setDespeckle(Number(e.target.value)); setPreset('CUSTOM'); }}
                                        className="w-full accent-cyan-500 cursor-pointer"
                                    />
                                </div>

                                {/* Contrast Adjustment */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        <span>Контраст перед векторизацией</span>
                                        <span className="text-cyan-600 dark:text-cyan-400">{contrast.toFixed(1)}x</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0.5"
                                        max="2.5"
                                        step="0.1"
                                        value={contrast}
                                        onChange={e => { setContrast(Number(e.target.value)); setPreset('CUSTOM'); }}
                                        className="w-full accent-cyan-500 cursor-pointer"
                                    />
                                </div>

                                {/* Black & White Threshold Toggle/Slider */}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Режим Черно-Белого Контура (1-бит)
                                        </span>
                                        <input 
                                            type="checkbox"
                                            checked={bwThreshold >= 0}
                                            onChange={e => {
                                                setBwThreshold(e.target.checked ? 128 : -1);
                                                setPreset('CUSTOM');
                                            }}
                                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                        />
                                    </div>
                                    {bwThreshold >= 0 && (
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                                                <span>Порог яркости (Binarization)</span>
                                                <span className="text-cyan-600">{bwThreshold}</span>
                                            </div>
                                            <input 
                                                type="range"
                                                min="0"
                                                max="255"
                                                value={bwThreshold}
                                                onChange={e => { setBwThreshold(Number(e.target.value)); setPreset('CUSTOM'); }}
                                                className="w-full accent-cyan-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* SVGO Cleanup Toggle */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                            SVGO Оптимизация путей
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            Объединение дублирующихся стилей и сокращение точного кода
                                        </span>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={optimizeSvg}
                                        onChange={e => setOptimizeSvg(e.target.checked)}
                                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-bold flex items-center gap-2">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        {/* Export & Action Buttons */}
                        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={downloadSvgFile}
                                disabled={!svgOutput || isTracing}
                                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                                    !svgOutput || isTracing
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:opacity-95 active:scale-98 shadow-cyan-500/20'
                                }`}
                            >
                                📥 Скачать SVG Вектор
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={downloadPngHighRes}
                                    disabled={!svgOutput || isTracing}
                                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
                                >
                                    🖼️ PNG High-Res (4x)
                                </button>
                                <button
                                    onClick={copySvgToClipboard}
                                    disabled={!svgOutput || isTracing}
                                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
                                >
                                    {copied ? '✓ Скопировано!' : '📋 Копировать SVG'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessorModal;
