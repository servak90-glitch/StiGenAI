

import { useMemo } from 'react';
import { Settings, PromptData, StyleKey } from '../types';
import { STYLE_LIBRARY, NEGATIVE_PROMPTS, APP_VERSION, PRO_STICKER_CONTOUR_PROMPT } from '../constants';
import { translations } from '../i18n';

export const usePromptGenerator = (settings: Settings): PromptData => {
    return useMemo(() => {
        let baseStylePrompt = "";
        let styleName = "UNKNOWN";

        if (settings.style === 'CUSTOM' && settings.customStyle) {
            const b = settings.customStyle;
            baseStylePrompt = `VIBE: ${b.style_metadata.vibe_description}. COLORS: ${b.color_logic.dominant_palette.join(', ')}. LINES: ${b.line_logic.stroke_dna}. TEXTURES: ${b.vfx_textures.noise_and_grit}. INVARIANTS: ${b.invariants.join(', ')}`;
            styleName = b.style_metadata.vibe_description.slice(0, 20) + "... (Custom)";
        } else {
            const styleConfig = STYLE_LIBRARY[settings.style as StyleKey];
            if (!styleConfig) {
                return {
                    prompt: "Error: Style not found",
                    negative_prompt: "",
                    settings,
                    metadata: {
                        generator: `StiGenAi v${APP_VERSION}`,
                        timestamp: new Date().toISOString(),
                        style: "UNKNOWN",
                        interpretation_mode: "STRICT",
                        priority_system_active: false
                    }
                };
            }
            const isStrict = settings.interpretationMode === 'STRICT';
            baseStylePrompt = isStrict ? styleConfig.strictPrompt : styleConfig.artisticPrompt;
            styleName = translations[styleConfig.nameKey]?.en || settings.style;
        }
        
        let prompt = `### SYSTEM_INSTRUCTION\n`;
        prompt += `- TASK: Create a high-quality sticker design.\n`;
        prompt += `- STYLE_DNA: ${baseStylePrompt}\n`;

        // HIGH PRIORITY SPATIAL CONSTRAINT
        if (settings.cameraLock || settings.poseLock) {
            prompt += `### SPATIAL_CONSTRAINT [HIGHEST PRIORITY]\n`;
            prompt += `- MODE: ABSOLUTELY_STRICT_GEOMETRY_LOCK\n`;
            prompt += `- INSTRUCTION: Do NOT rotate, mirror, flip, or normalize the angle of the subject. Reproduce the exact spatial mapping, pose, and perspective from the provided reference image.\n`;
            prompt += `- CONSTRAINT: 0% geometric deviation allowed. Use the original contours as a rigid cage.\n`;
            
            if (settings.modelTier === 'FAST') {
                prompt += `- CRITICAL GEOMETRY CONSTRAINT: Fast core must strictly adhere to the reference structure.\n`;
            }
        }

        // SUBJECT & CONTENT
        prompt += `### CONTENT_CORE\n`;
        if (settings.stickerType === 'TEXT' || settings.textMode === 'CUSTOM_TEXT') {
            prompt += `- SUBJECT: Typography design of the text "${settings.customText}".\n`;
            prompt += `- FONT_STYLE: ${settings.textShape} layout, ${settings.textSize} sizing.\n`;
            prompt += `- COLOR: ${settings.textColor}.\n`;
        } else {
             prompt += `- SUBJECT: Central character or object defined by the reference or general style.\n`;
        }

        // COMPOSITION & CONTAINER
        prompt += `### COMPOSITION\n`;
        if (settings.stickerMode === 'ISOLATION') {
             prompt += `- MODE: ISOLATION. Subject MUST be on a pure white background.\n`;
             prompt += `${PRO_STICKER_CONTOUR_PROMPT}\n`;
             prompt += `- BOUNDARY: Strong, closed outer contour. No cut-off edges.\n`;
        } else if (settings.stickerMode === 'CONTAINER') {
             prompt += `- MODE: CONTAINER. Subject inside a ${settings.stickerShape} shape.\n`;
             prompt += `- BACKGROUND: ${settings.styleBackground ? 'Stylized, detailed background within the shape.' : 'Solid color or minimal background.'}\n`;
        } else if (settings.stickerMode === 'FULL_IMAGE') {
             prompt += `- MODE: FULL IMAGE CANVAS. Edge-to-edge artwork. Complete scene composition.\n`;
             prompt += `- FRAMING: NO white borders. NO cutout style. Use the entire aspect ratio to display the artwork.\n`;
        }

        if (settings.detailLock) {
            prompt += `- DETAIL_PRECISION: CRITICAL_SPEC (No simplification).\n`;
        }

        // CONDITIONAL VISUAL ENGINE
        const hasVfxChanges = 
            settings.materialTexture !== 'STANDARD' || 
            settings.lightingPreset !== 'STANDARD' || 
            settings.particleEffects !== 'NONE' || 
            settings.colorVibrance !== 85;

        if (hasVfxChanges) {
            prompt += `### VISUAL_ENGINE\n`;
            if (settings.materialTexture !== 'STANDARD') {
                prompt += `- MATERIAL: ${settings.materialTexture} finish.\n`;
            }
            if (settings.lightingPreset !== 'STANDARD') {
                prompt += `- LIGHTING: ${settings.lightingPreset} setup.\n`;
            }
            if (settings.particleEffects !== 'NONE') {
                prompt += `- VFX: ${settings.particleEffects} particles active.\n`;
            }
            if (settings.colorVibrance !== 85) {
                prompt += `- COLOR_GRADING: Vibrance set to ${settings.colorVibrance}/100.\n`;
            }
        }

        // NEGATIVE PROMPT CONSTRUCTION
        let negativePrompt = NEGATIVE_PROMPTS.BASE;
        
        if (settings.stickerMode === 'ISOLATION') {
            // PRO mode needs "border" allowed in negative prompt for the contour trick to work
            if (settings.modelTier === 'PRO') {
                negativePrompt += `, ${NEGATIVE_PROMPTS.ISOLATION_PRO}`;
            } else {
                negativePrompt += `, ${NEGATIVE_PROMPTS.ISOLATION}`;
            }
        } else if (settings.stickerMode === 'CONTAINER') {
            negativePrompt += `, ${NEGATIVE_PROMPTS.CONTAINER}`;
        } else if (settings.stickerMode === 'FULL_IMAGE') {
            // For full image, we don't want isolated white backgrounds
            negativePrompt += `, white background, isolated, cut-out, border, frame`;
        }

        if (settings.stickerType === 'TEXT') {
             negativePrompt += `, ${NEGATIVE_PROMPTS.TEXT_ONLY}`;
        }

        if (settings.cameraLock || settings.poseLock) {
             negativePrompt += `, ${NEGATIVE_PROMPTS.GEOMETRY_LOCK}`;
        }

        if (settings.customNegativePrompt) {
            negativePrompt += `, ${settings.customNegativePrompt}`;
        }

        return {
            prompt,
            negative_prompt: negativePrompt,
            settings,
            metadata: {
                generator: `StiGenAi v${APP_VERSION}`,
                timestamp: new Date().toISOString(),
                style: styleName,
                interpretation_mode: settings.interpretationMode,
                priority_system_active: true
            }
        };

    }, [settings]);
};
