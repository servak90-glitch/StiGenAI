
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from './apiKeyManager';
import { TracerConfig } from './svgTracer';

export interface PreprocessConfig {
    blurRadius: number;
    contrast: number;
    threshold?: number; // 0-255 for hard binarization
}

export interface AnalysisResult {
    config: TracerConfig;
    preprocessConfig: PreprocessConfig;
    reasoning: string;
}

const ANALYSIS_PROMPT = `
Role: Senior Vector Graphics Engineer & Pre-press Specialist.
Task: Analyze the input image to determine the absolute best vectorization strategy to PREVENT LOSS OF DETAIL.

CRITICAL DECISION MATRIX:
1. **TEXT / LOGOS / GEOMETRIC SHAPES / TECHNICAL VECTORS**:
   - ERROR: "Soaping" (rounding corners) or "Noise" (tracing anti-aliasing pixels) is unacceptable.
   - ACTION: Request LOW thresholds (ltres/qtres ~0.1) and LOW pathomit (~2).
   - COLORS: If the image looks like a black & white technical drawing, logo, or icon, FORCE "numberofcolors": 2 to snap aliased edges to sharp vectors.
   - PREPROCESS: High contrast (1.5+), ZERO blur.

2. **ORGANIC / SKETCH / PAINTERLY**:
   - ERROR: Too much noise/jagged lines.
   - ACTION: Request MODERATE thresholds (ltres ~1.0) and HIGHER pathomit (~16).
   - PREPROCESS: Slight blur (0.5) to smooth strokes.

3. **MIXED CONTENT**:
   - Prioritize legibility of Text elements over smoothness of background.

Output JSON only:
{
  "content_type": "TEXT_GEOMETRIC" | "ORGANIC_SOFT" | "MIXED",
  "preprocess_blur": number, // 0.0 for Text/Logos, 0.5-2.0 for Art.
  "preprocess_contrast": number, // 1.0 (Normal) to 2.0 (High - use for logos/text).
  "binarize_threshold": number | null, // 0-255. Use ~128 if it's a black/white logo/icon or Technical Vector. Null for color art.
  
  // VTracer Params
  "ltres": number, // Linear Error. CRITICAL: Use 0.1 for TEXT/LOGOS. Use 1.0 for ART.
  "qtres": number, // Quadratic Error. CRITICAL: Use 0.1 for TEXT/LOGOS. Use 1.0 for ART.
  "pathomit": number, // Despeckle. Use 1-2 for TEXT (keep dots on 'i'). Use 16+ for ART.
  "rightangleenhance": boolean, // TRUE for logos/text/architecture. FALSE for organic.
  "numberofcolors": number, // 2 to 64. CRITICAL: Return 2 for B&W Technical Drawings.
  "reasoning": "Explain why these settings prevent soaping or noise."
}
`;

const SILHOUETTE_PROMPT = `
Role: Print Production Specialist.
Task: Analyze the SILHOUETTE of this object. 
Identify if it needs organic smoothing (for characters/hair) or geometric precision (for tech/objects).
Provide parameters for a PERFECTLY SMOOTH outer border for a sticker.
Output JSON only:
{
  "ltres": number, // 1.0 to 5.0 (Higher = smoother curves)
  "qtres": number, // 1.0 to 5.0 (Higher = smoother curves)
  "pathomit": number, // 16 to 128 (Higher = ignore small details/noise in contour)
  "blur": number, // 0.5 to 3.0 (Pre-trace blur for antialiasing)
  "reasoning": "Why these params?"
}
`;

/**
 * High-precision image analysis for vectorization.
 * Upgraded to Gemini 3 Pro Image for maximum structural reasoning.
 */
export const analyzeImageForTracing = async (base64Image: string): Promise<AnalysisResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.split(';')[0].split(':')[1];
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: ANALYSIS_PROMPT }] },
            config: { 
                temperature: 0.1, 
                responseMimeType: "application/json"
            }
        });
        
        const data = JSON.parse(response.text || '{}');
        const threshold = typeof data.binarize_threshold === 'number' ? data.binarize_threshold : undefined;

        // Fallback safety for hallucinations
        const ltres = Number(data.ltres) || 1;
        const qtres = Number(data.qtres) || 1;
        
        return {
            config: { 
                ltres: ltres, 
                qtres: qtres, 
                pathomit: Number(data.pathomit) || 8, 
                numberofcolors: threshold !== undefined ? 2 : (Number(data.numberofcolors) || 16),
                rightangleenhance: !!data.rightangleenhance
            },
            preprocessConfig: { 
                blurRadius: Number(data.preprocess_blur) || 0, 
                contrast: Number(data.preprocess_contrast) || 1.0,
                threshold: threshold
            },
            reasoning: data.reasoning || "AI Structural Analysis successful"
        };
    } catch (error) {
        console.warn("AI Analysis failed, using balanced defaults", error);
        return {
            config: { ltres: 1, qtres: 1, pathomit: 8, numberofcolors: 16 },
            preprocessConfig: { blurRadius: 0.5, contrast: 1.2 },
            reasoning: "Fallback used due to error"
        };
    }
};

/**
 * High-precision silhouette analysis for smooth sticker outlines.
 * Uses Gemini 3 Pro for maximum "intelligence".
 */
export const analyzeStickerOutline = async (base64Image: string): Promise<{config: TracerConfig, blur: number}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.split(';')[0].split(':')[1];

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: SILHOUETTE_PROMPT }] },
            config: { 
                temperature: 0.0, 
                responseMimeType: "application/json"
            }
        });

        const data = JSON.parse(response.text || '{}');
        return {
            config: {
                ltres: Number(data.ltres) || 2.5,
                qtres: Number(data.qtres) || 2.5,
                pathomit: Number(data.pathomit) || 32,
                numberofcolors: 2, // Mandatory for mask tracing
            },
            blur: Number(data.blur) || 1.0
        };
    } catch (e) {
        console.warn("AI Outline Analysis failed, using high-quality defaults", e);
        return { config: { ltres: 3.0, qtres: 3.0, pathomit: 64, numberofcolors: 2 }, blur: 1.5 };
    }
};
