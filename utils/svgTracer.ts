
import { optimize } from 'svgo';
import ImageTracer from 'imagetracerjs';
import { PreprocessConfig } from './smartTracer';
import { vTracerService } from './vtracerService';

export interface TracerConfig {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    strokewidth?: number;
    viewbox?: boolean;
    desc?: boolean;
    rightangleenhance?: boolean;
    blurradius?: number; 
    blurdelta?: number; 
    scale?: number;
    useVTracer?: boolean;
    optimize?: boolean; // New Flag for Structural Cleanup
}

export const TRACER_PRESETS: Record<string, TracerConfig> = {
    HIGH_DETAIL: { numberofcolors: 64, ltres: 0.1, qtres: 0.1, pathomit: 2, useVTracer: true }, 
    BALANCED: { numberofcolors: 16, ltres: 1, qtres: 0.5, pathomit: 4, useVTracer: true }, 
    SMOOTHED: { numberofcolors: 8, ltres: 1, qtres: 1, pathomit: 8, blurradius: 0, useVTracer: true },
    TECHNICAL: { numberofcolors: 16, ltres: 0.5, qtres: 0.5, pathomit: 2, useVTracer: true }
};

export type TracerPresetKey = keyof typeof TRACER_PRESETS;

// --- ImageTracer Fallback ---
const traceWithImageTracer = (imageData: ImageData, options: any): string => {
    try {
        const svg = (ImageTracer as any).imagedataToSVG(imageData, options);
        return svg || '';
    } catch (err) {
        console.error("ImageTracerJS failed:", err);
        return '';
    }
};

export const getOtsuThreshold = (imageData: ImageData): number => {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 10) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[gray]++;
            total++;
        }
    }
    if (total === 0) return 128;

    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const varBetween = wB * wF * (mB - mF) * (mB - mF);
        if (varBetween > varMax) {
            varMax = varBetween;
            threshold = t;
        }
    }
    return threshold;
};

const applySmartFilters = async (img: HTMLImageElement, config: PreprocessConfig): Promise<ImageData> => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context failed");

    const blur = config.blurRadius || 0;
    const contrast = config.contrast || 1.0;
    if (blur > 0 || contrast !== 1.0) {
        ctx.filter = `blur(${blur}px) contrast(${contrast * 100}%)`;
    }
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, img.width, img.height);

    if (config.threshold !== undefined && config.threshold !== null && (config.threshold >= 0 || config.threshold === -2)) {
        let thresh = config.threshold === -2 ? getOtsuThreshold(imageData) : config.threshold;
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 64) {
                // Transparent pixel -> fill white background for clean outlines
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
            } else {
                const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const val = luma >= thresh ? 255 : 0;
                data[i] = val; data[i + 1] = val; data[i + 2] = val; data[i + 3] = 255; 
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    return imageData;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image for tracing"));
        img.src = src;
    });
};

/**
 * Enhanced SVGO Optimization for Design-Ready Vectors.
 * Groups similar paths, merges colors, and cleans up metadata.
 */
const optimizeSvg = (svgString: string, aggressive: boolean = false): string => {
    if (!svgString || svgString.length < 50) return svgString;
    try {
        const plugins: any[] = [
            'cleanupAttrs', 
            'cleanupIds', 
            'cleanupNumericValues', 
            'removeDoctype', 
            'removeXMLProcInst', 
            'removeComments', 
            'removeMetadata', 
            'removeTitle', 
            'removeDesc', 
            'removeUselessDefs', 
            'removeEditorsNSData', 
            'minifyStyles', 
            'convertStyleToAttrs', 
            'convertColors', 
            'convertPathData', 
            'convertTransform', 
            'sortAttrs', 
            'reusePaths'
        ];

        if (aggressive) {
            plugins.push({
                name: 'convertShapeToPath',
                params: { convertArcs: true }
            });
            plugins.push('collapseGroups');
        }

        const result = optimize(svgString, {
            multipass: true,
            floatPrecision: 2,
            plugins: plugins
        });
        
        if (result && result.data && result.data.length > 20) {
            let output = result.data;
            if (!output.startsWith('<?xml')) output = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output;
            return output;
        }
        return svgString;
    } catch (e) { return svgString; }
}

const isValidSvg = (svg: string): boolean => {
    if (!svg || svg.length < 50) return false;
    return svg.includes('<path') || svg.includes('<polygon') || svg.includes('<rect') || svg.includes('<circle') || svg.includes('<g');
}

export const traceOutline = async (base64Image: string, config?: TracerConfig, preprocessConfig?: PreprocessConfig): Promise<string> => {
    const img = await loadImage(base64Image);
    
    // 1. Raster Pre-processing
    let imageData: ImageData;
    if (preprocessConfig) {
        imageData = await applySmartFilters(img, preprocessConfig);
    } else {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas context failed");
        ctx.drawImage(img, 0, 0);
        imageData = ctx.getImageData(0, 0, img.width, img.height);
    }
    
    const isBinary = preprocessConfig?.threshold !== undefined;
    let finalSvg = "";

    // 2. Try VTracer (WASM)
    if (config?.useVTracer !== false) {
        try {
            console.log("Attempting VTracer vectorization...");
            const svg = await vTracerService.trace(imageData, config);
            if (isValidSvg(svg)) {
                 finalSvg = svg;
            }
        } catch (e) {
            console.warn("VTracer failed. Falling back to Worker ImageTracer.", e);
        }
    }

    // 3. Fallback: ImageTracer (via Worker)
    if (!finalSvg) {
        console.log("Using ImageTracerJS fallback...");
        const options = {
            ltres: config?.ltres ?? 1,
            qtres: config?.qtres ?? (isBinary ? 1.0 : 1),
            pathomit: config?.pathomit ?? 4,
            rightangleenhance: config?.rightangleenhance ?? false,
            colorsampling: 2,
            numberofcolors: isBinary ? 2 : (config?.numberofcolors ?? 16),
            mincolorratio: 0,
            colorquantcycles: 3,
            strokewidth: 0,
            viewbox: true,
            desc: false,
            blurradius: 0, 
            blurdelta: 20
        };

        finalSvg = traceWithImageTracer(imageData, options);
    }

    // 4. Structural Cleanup (Auto-Layering Logic)
    if (finalSvg) {
        // Use aggressive optimization if requested or if using a "Technical" style where grouping is vital
        const shouldOptimize = config?.optimize === true || isBinary;
        finalSvg = optimizeSvg(finalSvg, shouldOptimize);
    }

    if (finalSvg && !finalSvg.startsWith('<?xml')) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + finalSvg;
    }
    
    return finalSvg;
};
