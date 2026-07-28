

import { useMemo } from 'react';
import { Settings, PromptData, StyleKey } from '../types';
import { STYLE_LIBRARY, NEGATIVE_PROMPTS, APP_VERSION, PRO_STICKER_CONTOUR_PROMPT } from '../constants';
import { translations } from '../i18n';

export const usePromptGenerator = (settings: Settings): PromptData => {
    return useMemo(() => {
        if (settings.style === 'LASER_ENGRAVING') {
            let prompt = `### SYSTEM_INSTRUCTION\n\n`;
            prompt += `- TASK: Transform and optimize the reference image into a high-precision, pre-processed 8-bit Grayscale master artwork specifically engineered for laser photo engraving (compatible with LightBurn dithering algorithms and power modulation).\n\n`;
            prompt += `- STYLE_DNA: Monochromatic High-Contrast Grayscale Master. Absolute 8-bit Grayscale spectrum (256 shades of grey). ABSOLUTELY NO RGB/CMYK COLOR PIXELS. Enhanced micro-contrast and local sharpness (Frequency Separation / High-Pass effect) to compensate for laser spot thermal diffusion. Controlled black depth: PREVENT solid #000000 block burns. All shadow regions must retain internal structure and line details to prevent material charring and detail loss. Optimized for physical engraving substrates (wood, leather, slate, anodized metal).\n\n`;
            
            prompt += `### SPATIAL_CONSTRAINT [HIGHEST PRIORITY]\n\n`;
            prompt += `- MODE: ABSOLUTELY_STRICT_GEOMETRY_LOCK\n`;
            prompt += `- INSTRUCTION: Do NOT rotate, mirror, flip, or alter the spatial orientation of the subject. Reproduce the exact spatial mapping, pose, framing, and perspective from the provided reference image.\n`;
            prompt += `- CONSTRAINT: 0% geometric deviation allowed. Use the original contours as a rigid structural frame.\n\n`;

            prompt += `### TONAL_&_CONTRAST_SPEC [LASER OPTIMIZATION]\n\n`;
            prompt += `- DYNAMIC_RANGE: Full grayscale spectrum with lifted shadows (~10-15% shadow boost) and compressed highlight clipping.\n`;
            prompt += `- MICRO_CONTRAST: Accentuated edge definition around critical detail zones (eyes, hair strands, surface textures, material edges).\n`;
            prompt += `- SHADOW_PROTECTION: High readability in dark areas; convert flat blacks into detailed dark-grey textures to avoid deep charring holes.\n`;
            prompt += `- HIGHLIGHT_PROTECTION: Preserve skin and surface highlights with subtle grey tonal values to prevent over-bleaching, while keeping the background isolated.\n\n`;

            prompt += `### COMPOSITION\n\n`;
            prompt += `- MODE: SUBJECT_ISOLATION.\n`;
            prompt += `- BACKGROUND: Pure, solid, error-free White (#FFFFFF). Zero noise, zero artifacts, zero grey tint on the background area (ensures zero laser firing outside the subject).\n`;
            prompt += `- BOUNDARY: Crisp, clean separation between the subject and the white background. No anti-aliasing blur on the outer border edge.\n\n`;

            prompt += `### DETAIL_PRECISION\n\n`;
            prompt += `- SPEC: Extreme micro-texture retention. Facial features, hair definition, fabric grain, and lighting highlights must be rendered with maximum localized contrast, perfectly prepared for Jarvis / Stucki dithering or 3D Grayscale processing.\n`;

            if (settings.stickerType === 'TEXT' || settings.textMode === 'CUSTOM_TEXT') {
                prompt += `\n### TYPOGRAPHY_INTEGRATION\n`;
                prompt += `- SUBJECT: Typography design of the text "${settings.customText}" integrated cleanly into the laser composition.\n`;
                prompt += `- FONT_STYLE: ${settings.textShape} layout, ${settings.textSize} sizing.\n`;
                prompt += `- COLOR: Rendered as high-contrast optimized grayscale typography.\n`;
            }

            const negativePrompt = NEGATIVE_PROMPTS.BASE + `, color, RGB, CMYK, colored, low contrast, blurry background, gradient background, color bleeding, soft borders`;

            return {
                prompt,
                negative_prompt: negativePrompt,
                settings,
                metadata: {
                    generator: `StiGenAi v${APP_VERSION}`,
                    timestamp: new Date().toISOString(),
                    style: "Laser Engraving",
                    interpretation_mode: settings.interpretationMode,
                    priority_system_active: true
                }
            };
        }

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
