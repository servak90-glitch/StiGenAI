
import { useMemo } from 'react';
import { CardSettings, PromptData, CardStyleKey } from '../types';
import { CARD_STYLE_LIBRARY, NEGATIVE_PROMPTS, APP_VERSION } from '../constants';
import { translations } from '../i18n';

export const useCardPromptGenerator = (settings: CardSettings): PromptData => {
    return useMemo(() => {
        const { style, interpretationMode, modelTier, cardData } = settings;
        const styleConfig = CARD_STYLE_LIBRARY[style as CardStyleKey];
        const isPro = modelTier === 'PRO';

        let prompt = "";
        let negativePrompt = NEGATIVE_PROMPTS.CARD_BASE;
        let systemInstruction = "";

        if (isPro) {
            systemInstruction = "ACT AS A PROFESSIONAL GRAPHIC DESIGNER & PRINT SPECIALIST. " +
                "WORLD RULES: " +
                "1. COMPOSITION: Generate a HIGH-END BUSINESS CARD CANVAS. " +
                "2. NO READABLE TEXT: Do not generate any specific letters or readable words. " +
                "3. WHITESPACE: Reserve 80% of the canvas as low-detail, high-contrast zones for text overlay. " +
                "4. RATIO: Adhere strictly to 16:9 aspect ratio. " +
                "5. STERILE CENTER: The middle area of the card must be perfectly clean or have a perfectly SYMMETRICAL minimal grid. Ensure 100% legibility in the absolute center. " +
                "6. SYMMETRY: Aim for balanced, centered compositions where possible.";
        }

        const rawStyle = interpretationMode === 'STRICT' ? styleConfig.strictPrompt : styleConfig.artisticPrompt;

        if (isPro) {
            prompt += `### TASK: LUXURY BUSINESS CARD CANVAS FOR "${cardData.company}"\n`;
            prompt += `- BRAND_CORE: ${cardData.companyDescription}\n`;
            prompt += `- STYLE_DNA: ${rawStyle}\n`;
            if (cardData.showLogo && !cardData.logoImage) {
                prompt += `- LOGO_GENERATION: Generate a clean minimalist logo icon in a corner.\n`;
            }
            prompt += `- DECOR: ${cardData.showDecor ? 'Symmetrical decorative elements in extreme margins only.' : 'Completely empty background'}\n`;
            prompt += `- COMPOSITION: Symmetrical layout. The absolute center MUST be a clean void for text.`;
        } else {
            prompt += `PROFESSIONAL SYMMETRICAL BUSINESS CARD BACKGROUND FOR ${cardData.company}: ${rawStyle}. `;
            prompt += `No text. Clean central area.`;
        }

        return {
            prompt: prompt.trim(),
            negative_prompt: negativePrompt,
            settings: { ...settings },
            metadata: {
                generator: `StiGenAi v${APP_VERSION}`,
                timestamp: new Date().toISOString(),
                style: translations[styleConfig.nameKey]?.en || style,
                interpretation_mode: interpretationMode,
                priority_system_active: true,
                systemInstruction: isPro ? systemInstruction : undefined
            },
        };
    }, [settings]);
};
