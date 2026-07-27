
export type StyleKey = '80S_CARTOON' | 'CYBERPUNK' | 'KAWAII' | 'ART_DECO' | 'BRUTALISM' | 'LIQUID' | 'WOODCUT' | 'STAINED_GLASS' | 'EMBROIDERY' | 'PAPER_CUT' | 'PAPER_CUT_ART' | 'BOTANICAL_ILLUSTRATION' | 'WATERCOLOR_NATURE' | 'POP_ART' | 'SCANDINAVIAN' | 'STEAMPUNK' | 'UFO_PSYCHEDELIC' | 'LYRICAL_GRAPHIC' | 'NEO_POP' | 'CHILD_DRAWING' | 'NEON_COSMIC_CGI' | 'SCRATCHBOARD_POSTER' | 'GRAPHITE_SKETCH' | 'VIBRANT_DIGITAL_COMIC' | 'SUNSET_VECTOR_NOIR' | 'TECHNICAL_VECTOR' | 'KNITTED_DIORAMA_ART' | 'CUSTOM';

export type CardStyleKey = 'CORPORATE_SWISS' | 'LUXURY_NOIR' | 'TECH_CYBER' | 'ECO_BOTANICAL';

export type CardLayout = 'CLASSIC' | 'CENTER' | 'VERTICAL';

export type Quality = 'STANDARD' | 'PREMIUM' | 'ULTRA' | 'MASTER';
export type Vector = 'YES' | 'NO';
export type OutlineOnly = 'YES' | 'NO';
export type OutlineWeight = 'THIN' | 'MEDIUM' | 'THICK';
export type TextMode = 'NO_TEXT' | 'CUSTOM_TEXT';
export type TextPosition = 'BOTTOM' | 'TOP' | 'AROUND' | 'INTEGRATED';
export type TextColor = string;
export type TextShape = 'STRAIGHT' | 'ARCH_UP' | 'ARCH_DOWN' | 'CIRCULAR';
export type TextSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type StickerType = 'IMAGE' | 'TEXT';
export type StickerMode = 'ISOLATION' | 'CONTAINER' | 'FULL_IMAGE';
export type StickerShape = 'NONE' | 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'OCTAHEDRON';
export type InterpretationMode = 'STRICT' | 'ARTISTIC';
export type MaterialTexture = 'STANDARD' | 'WET' | 'GLOSSY' | 'METALLIC' | 'GLASS';
export type ParticleEffect = 'NONE' | 'DROPLEETS' | 'MIST' | 'SPARKLES' | 'GLOW';
export type LightingPreset = 'STANDARD' | 'RIM_LIGHT' | 'STUDIO' | 'DRAMATIC' | 'CINEMATIC';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type Category = 'style' | 'format' | 'quality' | 'advanced' | 'background' | 'text' | 'vfx' | 'harmony';
export type StyleCategoryKey = 'GRAPHICS_AND_DESIGN' | 'ANIME_AND_CARTOONS' | 'ART_TECHNIQUES' | 'TECHNO_AND_FUTURISM' | 'ABSTRACTION_AND_PSYCHEDELIA' | 'ARCHITECTURE_AND_MINIMALISM';
export type ModelTier = 'FAST' | 'PRO'; 

export type WizardVibe = 'FUN' | 'ARTSY' | 'TECH' | 'WEIRD';

export interface StyleBlueprint {
    style_metadata: {
        vibe_description: string;
        complexity_score: number;
    };
    color_logic: {
        dominant_palette: string[];
        harmony_type: string;
        shading_rules: string;
    };
    line_logic: {
        weight: string;
        stroke_dna: string;
        outline_consistency: string;
    };
    vfx_textures: {
        noise_and_grit: string;
        overlay_elements: string[];
        lighting_model: string;
    };
    negative_dna: string[];
    invariants: string[];
}

export interface CardData {
    company: string;
    companyDescription: string;
    name: string;
    position: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    slogan: string;
    telegram: string;
    instagram: string;
    whatsapp: string;
    qrCodeData: string;
    showQrCode: boolean;
    logoImage: string | null;
    showLogo: boolean;
    showBackSide: boolean;
    showSocial: boolean;
    showDecor: boolean;
    textOffsetX: number;
    textOffsetY: number;
    logoOffsetX: number;
    logoOffsetY: number;
    qrOffsetX: number;
    qrOffsetY: number;
    textScale: number;
    logoScale: number;
    qrScale: number;
    fontFamily: string;
    letterSpacing: number;
    accentColor: string;
    isTextLight: boolean;
}

export interface BrandKit {
    id: string;
    name: string;
    company: string;
    description: string;
    slogan: string;
    logoImage: string | null;
    accentColor: string;
    fontFamily: string;
    timestamp: number;
}

export interface BrandBundle {
    logo: string | null;
    pattern: string | null;
    social: string | null;
    banner: string | null;
    color: string;
    style: CardStyleKey;
}

export interface Settings {
    style: StyleKey;
    quality: Quality;
    vector: Vector;
    outlineOnly: OutlineOnly;
    outlineWeight: OutlineWeight;
    textMode: TextMode;
    customText: string;
    textPosition: TextPosition;
    textColor: TextColor;
    textShape: TextShape;
    textSize: TextSize;
    cameraLock: boolean;
    detailLock: boolean;
    poseLock: boolean;
    backgroundLock: boolean;
    styleBackground: boolean;
    stickerType: StickerType;
    stickerMode: StickerMode;
    stickerShape: StickerShape;
    interpretationMode: InterpretationMode;
    materialTexture: MaterialTexture;
    subsurfaceScattering: boolean;
    particleEffects: ParticleEffect;
    lightingPreset: LightingPreset;
    aspectRatio: AspectRatio;
    customNegativePrompt: string;
    customNegativePromptValue?: string;
    colorVibrance: number;
    modelTier: ModelTier; 
    customStyle?: StyleBlueprint;
}

export interface CardSettings extends Omit<Settings, 'style'> {
    style: CardStyleKey;
    cardData: CardData;
    layout: CardLayout;
}

export interface StyleInfo {
    nameKey: string;
    emoji: string;
    badgeKey: string;
    category: StyleCategoryKey;
    tagKeys: string[];
    strictPrompt: string;
    artisticPrompt: string;
    locks?: (keyof Settings)[];
    tipKey?: string;
}

export type StyleLibrary = Record<StyleKey, StyleInfo>;
export type CardStyleLibrary = Record<CardStyleKey, StyleInfo>;

export interface PromptData {
    prompt: string;
    negative_prompt: string;
    settings: Settings | CardSettings;
    metadata: {
        generator: string;
        timestamp: string;
        style: string;
        interpretation_mode: InterpretationMode;
        priority_system_active: boolean;
        systemInstruction?: string;
    };
}

export interface Preset {
    id: string;
    name: string;
    settings: Settings;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface LicenseFeatures {
    allowStickers: boolean;
    allowPro: boolean;
    allowBatch: boolean;
    allowVector: boolean;
    allowUpscale: boolean;
    allowCards: boolean;
    allowPrint: boolean;
    allowHarmony: boolean;
    allowScanner: boolean;
    allowTransposer: boolean;
    allowPack: boolean;
}

export interface LicenseLimits {
    generations: number;
    days: number;
}

export interface License {
    key: string;
    status: 'created' | 'active' | 'expired' | 'banned';
    features: LicenseFeatures;
    limits: LicenseLimits;
    usage: {
        usedGenerations: number;
    };
    createdAt: number;
    activatedAt?: number;
    expiresAt?: number;
}
