
import { CardData, CardStyleKey } from '../types';
import { CARD_STYLE_LIBRARY } from '../constants';

export interface BrandAssetConfig {
    prompt: string;
    aspectRatio: "1:1" | "16:9";
}

/**
 * Orchestrates prompts for full brand identity kit.
 */
export const getBrandAssetPrompts = (data: CardData, style: CardStyleKey): Record<string, BrandAssetConfig> => {
    const styleInfo = CARD_STYLE_LIBRARY[style];
    const styleDesc = styleInfo.strictPrompt;

    return {
        logo: {
            prompt: `Minimalist flat vector icon logo for a brand "${data.company}". Brand essence: ${data.companyDescription}. Style: ${styleDesc}. Pure white background, centered, high contrast, clean geometry. No text.`,
            aspectRatio: "1:1"
        },
        pattern: {
            prompt: `Seamless repeating geometric pattern for high-end corporate identity. Inspired by "${data.company}". Motifs: ${data.companyDescription}. Style: ${styleDesc}. Uniform repeating units, professional balance, aesthetic symmetry. No text.`,
            aspectRatio: "1:1"
        },
        social: {
            prompt: `Square social media profile cover or highlight icon for "${data.company}". Consistent with brand style: ${styleDesc}. Elegant composition using accent color ${data.accentColor}. Clean and professional.`,
            aspectRatio: "1:1"
        },
        banner: {
            prompt: `Professional 16:9 widescreen website hero banner for "${data.company}". Luxury business aesthetic. Style: ${styleDesc}. Large empty space on the left for web content. Minimalist branding elements on the right. High-end visual.`,
            aspectRatio: "16:9"
        }
    };
};
