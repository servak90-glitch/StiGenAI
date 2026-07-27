
import { Settings, StyleLibrary, StyleKey, StyleCategoryKey, CardStyleLibrary, CardData, CardSettings } from './types';

export const APP_VERSION = '6.6.2';

export const PRO_STICKER_CONTOUR_PROMPT = "STICKER CONTOUR: Around the object itself there is a clear, solid WHITE outline that exactly follows its outer contour (die-cut shape). This white outline is surrounded by a thick outer BLACK contour line.";

export const NEGATIVE_PROMPTS: Record<string, string> = {
    BASE: "low quality, bad quality, lowres, ugly, blurry, pixelated, noise, artifacts, compression, jpeg artifacts, watermark, text, signature, logo, writing, username, bad anatomy, distorted, deformed, 3d render, shadows, depth of field, realistic textures, volumetric lighting, photorealism",
    CARD_BASE: "photorealistic people, blurry backgrounds, messy textures, small unreadable scribbles, pixel art, low contrast, cluttered center, distorted edges, generic stock photo look, actual letters, readable text, fake words, unreadable text blocks",
    TEXT_ONLY: "illustration, painting, drawing, photo, photography, 3d render, character, person, face, animal, object, scenery, background",
    CONTAINER: "out of frame, cut off, cropped, partial, unfinished, subject touching edge, bleeding edges, overflow, border violation, spilling over, escaping container, dripts outside shape, content leakage, white halo, internal borders, shadows outside, busy background, messy patterns, clutter, complex geometry, warped geometry, asymmetrical shape, wobbly lines, hand-drawn circle, distorted square, irregular border weight",
    ISOLATION: "background, scene, wall, floor, room, environment, landscape, shadow, drop shadow, ambient occlusion, ground plane, contact shadows, cast shadows, floor lighting, reflections, noise, gradient background, border, frame, edge, container, square, rectangle, blueprint, grid, paper, poster, sheet, ground",
    ISOLATION_PRO: "background, scene, wall, floor, room, environment, landscape, shadow, drop shadow, ambient occlusion, ground plane, contact shadows, cast shadows, floor lighting, reflections, noise, gradient background, container, square, rectangle, blueprint, grid, paper, poster, sheet, ground", // Removed border, frame, edge
    COLOR_PRESERVATION: "different colors, changed colors, altered hue, washed out, faded, black and white, grayscale",
    STRICT_TRANSFORMATION: "deformation, distortion, extra limbs, bad proportions, mutation, mutated",
    NO_TEXT: "text, writing, letters, signature, watermark, logo, typography, font, words, speech bubble",
    VECTOR_OPTIMIZED: "blur, soft edges, gradients, shadows, antialiasing, noise, realistic, 3d, rendering, photo, texture, sketching, pencil, glow",
    GEOMETRY_LOCK: "rotated view, changed perspective, mirroring, flipping, angle normalization, viewport shift, composition change, tilt, zoom"
};

export interface EmotionPreset {
    id: string;
    nameRu: string;
    nameEn: string;
    prompt: string;
    textRu: string;
    textEn: string;
}

export interface EmotionCategory {
    id: string;
    nameRu: string;
    nameEn: string;
    emotions: EmotionPreset[];
}

export const EMOTION_LIBRARY: EmotionCategory[] = [
    {
        id: 'work',
        nameRu: 'Работа и Дедлайны',
        nameEn: 'Work & Burnout',
        emotions: [
            { id: 'internal_scream', nameRu: 'Внутренний крик', nameEn: 'Internal Scream', prompt: 'Character smiling politely, but the reflection in glasses or mirror shows a screaming face or fire.', textRu: 'Всё норм', textEn: 'This is fine' },
            { id: 'brain_melt', nameRu: 'Плавление мозга', nameEn: 'Brain Melt', prompt: 'Character\'s head smoking, eyes swirling spirals, physically melting onto the desk like ice cream.', textRu: 'Мозг плавится...', textEn: 'Loading...' },
            { id: 'survival', nameRu: 'Выживание', nameEn: 'Survival', prompt: 'Character with dark circles under eyes holding a coffee cup larger than their head, shaking hands.', textRu: 'Мне нужно топливо!!!', textEn: 'I need a fuel!!!' },
            { id: 'burned_out', nameRu: 'Сгорел', nameEn: 'Burned Out', prompt: 'An office chair containing only a pile of ash and a pair of glasses.', textRu: 'Я всё', textEn: 'Done' },
            { id: 'deadline', nameRu: 'Дедлайн сзади', nameEn: 'Deadline Behind', prompt: 'Character typing at computer while a giant shadow monster with a clock stands behind them.', textRu: 'Скоро', textEn: 'Soon' },
            { id: 'procrastination', nameRu: 'Прокрастинация', nameEn: 'Procrastination', prompt: 'Character busily sharpening a pencil or watering a flower while a huge monster "Deadline" stands behind.', textRu: 'Очень занят', textEn: 'Busy' },
            { id: 'bsod', nameRu: 'Синий экран', nameEn: 'BSOD', prompt: 'Character\'s face froze, eyes became dead glass, expression of total system failure.', textRu: 'Ошибка', textEn: 'Error' }
        ]
    },
    {
        id: 'sarcasm',
        nameRu: 'Сарказм и Осуждение',
        nameEn: 'Sarcasm & Judgment',
        emotions: [
            { id: 'eye_roll', nameRu: 'Закатывание глаз', nameEn: 'Eye Roll', prompt: 'Eyes rolled back so far only whites are visible, head tilted back in extreme annoyance.', textRu: 'Ой всё', textEn: 'Oh please' },
            { id: 'facepalm', nameRu: 'Испанский стыд', nameEn: 'Facepalm', prompt: 'Character burying face in palm (facepalm), sliding down under the table in embarrassment.', textRu: 'Мда...', textEn: 'Why?' },
            { id: 'nerd', nameRu: 'Душнила', nameEn: 'Nerd', prompt: 'Character adjusting glasses, one finger raised in a "correction" gesture, smug expression.', textRu: 'Душно...', textEn: 'Actually...' },
            { id: 'sarcastic_like', nameRu: 'Саркастичный лайк', nameEn: 'Sarcastic Like', prompt: 'Character giving a thumbs up, but facial expression shows pain or disgust.', textRu: 'Спасиб(о)', textEn: 'Great' },
            { id: 'clown', nameRu: 'Клоун', nameEn: 'Clown', prompt: 'Character looking in a mirror and putting on a red clown nose or wig.', textRu: 'Лол', textEn: '🤡' },
            { id: 'wonka', nameRu: 'Ну давай, расскажи', nameEn: 'Condescending', prompt: 'Character resting chin on hand, looking with a condescending smile (Willy Wonka meme style).', textRu: 'Ну-ну', textEn: 'Tell me' },
            { id: 'fake_compliment', nameRu: 'Сомнительный комплимент', nameEn: 'Fake Compliment', prompt: 'Character smiling, but the smile looks more like a grimace or a snarl.', textRu: 'Миленько', textEn: 'Nice...' }
        ]
    },
    {
        id: 'aggression',
        nameRu: 'Агрессия и Власть',
        nameEn: 'Aggression & Power',
        emotions: [
            { id: 'passive_aggressive', nameRu: 'Пассивная агрессия', nameEn: 'Passive Aggressive', prompt: 'Character with a very wide, sweet smile, but holding a knife or chainsaw behind their back.', textRu: 'Очень рад', textEn: 'So happy' },
            { id: 'evil_plan', nameRu: 'Зловещий план', nameEn: 'Evil Plan', prompt: 'Character rubbing hands together greedily, sly narrowed eyes, villainous expression.', textRu: 'Хе-хе', textEn: 'He-he' },
            { id: 'told_ya', nameRu: 'Я же говорил', nameEn: 'Told You So', prompt: 'Character with arms crossed, nose high in the air, looking down arrogantly.', textRu: 'Ясно', textEn: 'Told ya' },
            { id: 'killer_look', nameRu: 'Взгляд убийцы', nameEn: 'Killer Look', prompt: 'Character\'s face covered in shadow, only two red glowing dots for pupils are visible.', textRu: 'Беги', textEn: 'Run' },
            { id: 'rage', nameRu: 'Микро-ярость', nameEn: 'Micro Rage', prompt: 'A very small, cute character (chibi style) exploding with rage, fire around.', textRu: 'ЪУЪ', textEn: 'RAGE' }
        ]
    },
    {
        id: 'drama',
        nameRu: 'Драма и Тлен',
        nameEn: 'Drama',
        emotions: [
            { id: 'lying_down', nameRu: 'Драматичное лежание', nameEn: 'Lying Down', prompt: 'Character lying face down on the floor, limbs spread out in defeat, small rain cloud raining on them.', textRu: 'Тлен', textEn: 'Mood' },
            { id: 'laugh_cry', nameRu: 'Смех сквозь слезы', nameEn: 'Laugh Cry', prompt: 'Streams of tears flowing from eyes, but mouth is wide open in hysterical laughter.', textRu: 'Я в порядке', textEn: 'I\'m ok' },
            { id: 'sunset', nameRu: 'Уход в закат', nameEn: 'Sunset Walk', prompt: 'Silhouette of character walking away into the sunset with a bindle (bag on a stick).', textRu: 'Ой всё', textEn: 'Bye' },
            { id: 'shawarma', nameRu: 'Шаурма (В одеяле)', nameEn: 'Blanket Burrito', prompt: 'Character wrapped tightly in a blanket like a shawarma, only scared eyes visible.', textRu: 'Я в домике', textEn: 'Safe' },
            { id: 'void', nameRu: 'Экзистенциальная пустота', nameEn: 'The Void', prompt: 'Character staring blankly into a single point, surrounded by a dark vignette void.', textRu: '...', textEn: '...' }
        ]
    },
    {
        id: 'love',
        nameRu: 'Любовь',
        nameEn: 'Love',
        emotions: [
            { id: 'aggressive_love', nameRu: 'Агрессивная любовь', nameEn: 'Aggressive Love', prompt: 'Character hugging someone/something so hard they are turning blue, expression of crazy adoration.', textRu: 'Люблю!', textEn: 'Love u' },
            { id: 'cute_explosion', nameRu: 'Взрыв от милоты', nameEn: 'Cute Explosion', prompt: 'Character\'s eyes are stars, mouth open, rainbows exploding from the head.', textRu: 'Милота!', textEn: 'WOW' },
            { id: 'flirt', nameRu: 'Флирт', nameEn: 'Flirt', prompt: 'Character raising eyebrows playfully, looking with a "hint", comical flirting face.', textRu: 'Ку-ку', textEn: 'Hey' },
            { id: 'simp', nameRu: 'Симп (Лужица)', nameEn: 'Simp', prompt: 'Character melted into a puddle at the feet of someone else, looking up with hearts in eyes.', textRu: 'Богиня', textEn: 'Queen' }
        ]
    },
    {
        id: 'confusion',
        nameRu: 'Недоумение',
        nameEn: 'Confusion',
        emotions: [
            { id: 'math_lady', nameRu: 'Математика', nameEn: 'Math Lady', prompt: 'Character trying to calculate something, complex math formulas orbiting head, confused expression.', textRu: 'Эээ...', textEn: '404' },
            { id: 'instruction', nameRu: 'Зависший взгляд', nameEn: 'Lost', prompt: 'Character looking at a map or instruction manual holding it upside down, looking lost.', textRu: 'Как?', textEn: 'Hmmm' },
            { id: 'travolta', nameRu: 'Кто здесь?', nameEn: 'Confused Travolta', prompt: 'Character looking around in a panic in an empty white room, feeling lost.', textRu: 'Ау?', textEn: 'Where?' },
            { id: 'error_404', nameRu: 'Ошибка 404', nameEn: 'Error 404', prompt: 'Character shrugging with pockets pulled inside out, blank facial expression.', textRu: 'Нет идей', textEn: 'No idea' }
        ]
    },
    {
        id: 'money',
        nameRu: 'Деньги и Успех',
        nameEn: 'Money & Stonks',
        emotions: [
            { id: 'alone_party', nameRu: 'Одинокая вечеринка', nameEn: 'Lonely Party', prompt: 'Character in a party hat blowing a party horn, sitting alone in an empty room with one cupcake.', textRu: 'Ура...', textEn: 'Yay' },
            { id: 'stonks', nameRu: 'Stonks', nameEn: 'Stonks', prompt: 'Character standing proudly in front of a stock graph going straight up, looking self-important.', textRu: 'Гений', textEn: 'Stonks' },
            { id: 'money_rain', nameRu: 'Денежный дождь', nameEn: 'Money Rain', prompt: 'Character throwing money in the air, head back, arms wide open.', textRu: 'Гуляем', textEn: 'Make it rain' },
            { id: 'chefs_kiss', nameRu: 'Шеф-повар', nameEn: 'Chef\'s Kiss', prompt: 'Character making the "perfect" gesture with fingers, kissing them, eyes closed in pleasure.', textRu: 'Вкусно', textEn: 'Perfecto' }
        ]
    }
];

export const CARD_FONTS = [
    { name: 'Inter', family: '"Inter", sans-serif' },
    { name: 'Montserrat', family: '"Montserrat", sans-serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
    { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' }
];

export const INITIAL_CARD_DATA: CardData = {
    company: 'StiGenAi Corp',
    companyDescription: 'Innovative AI-powered design studio focused on automation and high-end visual creativity.',
    name: 'Yaroslav Design',
    position: 'Lead Art Director',
    address: 'Silicon Valley, CA',
    phone: '+1 (555) 0123',
    email: 'hello@stigenai.io',
    website: 'www.stigenai.io',
    slogan: 'Future of AI Design',
    telegram: '@stigenai',
    instagram: 'stigen_ai',
    whatsapp: '+15550123',
    qrCodeData: 'https://stigenai.io',
    showQrCode: true,
    logoImage: null,
    showLogo: true,
    showBackSide: true,
    showSocial: true,
    showDecor: true,
    textOffsetX: 0,
    textOffsetY: 0,
    logoOffsetX: 0,
    logoOffsetY: 0,
    qrOffsetX: 0,
    qrOffsetY: 0,
    textScale: 1.0,
    logoScale: 1.0,
    qrScale: 1.0,
    fontFamily: '"Inter", sans-serif',
    letterSpacing: 0,
    accentColor: '#A8D5D8',
    isTextLight: false
};

export const INITIAL_SETTINGS: Settings = {
    style: '80S_CARTOON',
    quality: 'PREMIUM',
    vector: 'YES',
    outlineOnly: 'NO',
    outlineWeight: 'MEDIUM',
    textMode: 'NO_TEXT',
    customText: '',
    textPosition: 'BOTTOM',
    textColor: '#000000',
    textShape: 'STRAIGHT',
    textSize: 'MEDIUM',
    cameraLock: true,
    detailLock: true,
    poseLock: true,
    backgroundLock: false,
    styleBackground: false,
    stickerType: 'IMAGE',
    stickerMode: 'ISOLATION',
    stickerShape: 'NONE',
    interpretationMode: 'STRICT',
    materialTexture: 'STANDARD',
    subsurfaceScattering: false,
    particleEffects: 'NONE',
    lightingPreset: 'STANDARD',
    aspectRatio: '1:1',
    customNegativePrompt: '',
    colorVibrance: 85,
    modelTier: 'FAST', 
};

export const INITIAL_CARD_SETTINGS: CardSettings = {
    ...INITIAL_SETTINGS,
    style: 'CORPORATE_SWISS' as any,
    cardData: INITIAL_CARD_DATA,
    aspectRatio: '16:9',
    layout: 'CLASSIC'
};

export const CARD_STYLE_LIBRARY: CardStyleLibrary = {
    'CORPORATE_SWISS': {
        nameKey: 'card.style.swiss.name', emoji: '🇨🇭', badgeKey: 'card.style.swiss.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.minimalism', 'tags.modern', 'tags.architecture'],
        strictPrompt: `Swiss Graphic Design style. Clean minimalist business card background. Strict grid layout. High whitespace. Primary colors only. No gradients. Focus on geometric balance. Leave center and corner zones clear for text overlay.`,
        artisticPrompt: `Modern Bauhaus-inspired business card background. Abstract geometric shapes, clean lines, professional minimalist aesthetic. Primary color palette. Clear readability zones.`
    },
    'LUXURY_NOIR': {
        nameKey: 'card.style.luxury.name', emoji: '💎', badgeKey: 'card.style.luxury.badge', category: 'ARCHITECTURE_AND_MINIMALISM',
        tagKeys: ['tags.luxury', 'tags.elegant', 'tags.dark'],
        strictPrompt: `Luxury business card background. Deep matte black texture. Gold foil decorative line art elements. Embossed professional aesthetic. Minimalist elegant composition. High contrast between black and gold.`,
        artisticPrompt: `Premium dark mode business card. Silk texture background, subtle marble veins, gold leaf accents, sophisticated high-end design. Deep shadows and rich textures.`
    },
    'TECH_CYBER': {
        nameKey: 'card.style.tech.name', emoji: '💻', badgeKey: 'card.style.tech.badge', category: 'TECHNO_AND_FUTURISM',
        tagKeys: ['tags.technology', 'tags.neon', 'tags.cyber'],
        strictPrompt: `Cybernetic interface business card background. Glassmorphism effect. Neon circuit lines. Semi-transparent layers. Futuristic digital grid. High-tech look, dark themes with glowing accents.`,
        artisticPrompt: `Sci-fi tech business card. HUD elements, glowing data streams, holographic textures, blue and violet neon color scheme. Abstract technical data visualization.`
    },
    'ECO_BOTANICAL': {
        nameKey: 'card.style.eco.name', emoji: '🌿', badgeKey: 'card.style.eco.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.nature', 'tags.watercolor', 'tags.soft'],
        strictPrompt: `Recycled paper texture background. Minimalist botanical line art. Earthy tones (sage, terracotta). Hand-drawn organic shapes. Natural professional look. Clear spaces for text.`,
        artisticPrompt: `Eco-friendly business card design. Soft watercolor washes, organic leaf silhouettes, textured beige paper, calming nature-inspired aesthetic. Gentle gradients and soft forms.`
    }
};

export const ARTISTIC_STYLES: string[] = ['GRAPHITE_SKETCH', 'PAPER_CUT_ART', 'LYRICAL_GRAPHIC', 'CHILD_DRAWING', 'LIQUID', 'NEON_COSMIC_CGI', 'SCRATCHBOARD_POSTER', 'SUNSET_VECTOR_NOIR'];
export const ALWAYS_ARTISTIC_STYLES: string[] = ['NEON_COSMIC_CGI', 'POP_ART', 'CYBERPUNK', 'STAINED_GLASS', 'UFO_PSYCHEDELIC', 'NEO_POP', 'LIQUID', 'SCRATCHBOARD_POSTER', 'KNITTED_DIORAMA_ART', 'WATERCOLOR_NATURE'];

export const REQUIRES_ISOLATION_STYLES: string[] = ['BRUTALISM', 'BOTANICAL_ILLUSTRATION', 'TECHNICAL_VECTOR'];
export const REQUIRES_CONTAINER_STYLES: string[] = ['NEON_COSMIC_CGI', 'VIBRANT_DIGITAL_COMIC', 'PAPER_CUT', 'SUNSET_VECTOR_NOIR'];
export const REQUIRES_STRICT_STYLES: StyleKey[] = ['VIBRANT_DIGITAL_COMIC', 'GRAPHITE_SKETCH', 'TECHNICAL_VECTOR', '80S_CARTOON'];


export const COMPOSITIONAL_STYLES: StyleKey[] = ['VIBRANT_DIGITAL_COMIC', 'NEON_COSMIC_CGI', 'PAPER_CUT', 'GRAPHITE_SKETCH', 'SUNSET_VECTOR_NOIR', 'KNITTED_DIORAMA_ART'];

export const STYLE_CATEGORIES_ORDER: StyleCategoryKey[] = [
    'GRAPHICS_AND_DESIGN',
    'ANIME_AND_CARTOONS',
    'ART_TECHNIQUES',
    'TECHNO_AND_FUTURISM',
    'ABSTRACTION_AND_PSYCHEDELIA',
    'ARCHITECTURE_AND_MINIMALISM',
];

export const STYLE_LIBRARY: StyleLibrary = {
    'TECHNICAL_VECTOR': {
        nameKey: 'style.technical_vector.name', emoji: '📐', badgeKey: 'style.technical_vector.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.vector', 'tags.design', 'tags.outlines', 'tags.flat_composition', 'tags.modern'],
        strictPrompt: `Technical Vector Tracing (STRICT BINARY OUTPUT) - MANDATORY: Use ONLY TWO COLORS: pure #000000 (black) and pure #FFFFFF (white). ABSOLUTELY NO SHADING, NO GRADIENTS, NO GREYSCALE, NO THIRD COLOR. Total color count must be exactly 2. Create a high-contrast binary vector graphic. Black ink on solid white. Every line must be solid black. Optimized for plotter cutting.`,
        artisticPrompt: `Artistic 1-Bit Illustration - High contrast black ink on white. Bold graphic lines. Stencil aesthetic. No gradients. Minimalist and sharp. Only black and white.`,
        locks: ['materialTexture', 'subsurfaceScattering', 'particleEffects', 'lightingPreset', 'colorVibrance'], 
        tipKey: 'style.technical_vector.tip'
    },
    '80S_CARTOON': { 
        nameKey: 'style.80s_cartoon.name', emoji: '🎸', badgeKey: 'style.80s_cartoon.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.retro', 'tags.vibrant', 'tags.graphic', 'tags.universal', 'tags.pop_culture', 'tags.nostalgia'], 
        strictPrompt: `80s vintage cartoon aesthetic - STRICT COLOR MATCHING: Copy colors EXACTLY from the reference image. - Authentic limited cel animation palette - Bold black outlines with uniform weight - Flat color fills - NO GRADIENTS, NO SOFT SHADING - Hard-edged shadows (Cel Shading).`,
        artisticPrompt: `80s retro cartoon interpretation - Transform reference into bold graphic cartoon style - Thick black outlines with uniform weight - Vibrant flat color fills - Simplify forms into clean geometric shapes - Retro color scheme (Max 12 colors) - Hand-drawn aesthetic`,
    },
    'POP_ART': { 
        nameKey: 'style.pop_art.name', emoji: '🟡', badgeKey: 'style.pop_art.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.pop_art', 'tags.vibrant', 'tags.contrast', 'tags.comics', 'tags.mass_culture', 'tags.1960s'], 
        strictPrompt: `Pop art style with bold colors and comic aesthetic - Bold primary colors with high contrast - Ben-day dots printing technique - Comic book style outlines and halftones - Graphic poster-like composition.`,
        artisticPrompt: `Pop art artistic interpretation - Transform reference into bold pop art style - Primary colors with high contrast - Ben-day dots printing technique - Comic book outlines and halftones - Graphic poster composition`,
    },
    'NEO_POP': { 
        nameKey: 'style.neo_pop.name', emoji: '🎨', badgeKey: 'style.neo_pop.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.graphic', 'tags.modern', 'tags.vibrant', 'tags.vector', 'tags.design', 'tags.pop_art', 'tags.digital'], 
        strictPrompt: `Modern neo-pop art illustration style with technical precision - STRICT COLOR PALETTE: yellow (#FFD23F), red (#FF3A4D), dark blue (#0F3B72), cyan (#1CA7FF), orange (#FF7A00), near-black (#0B1D35) - Bold 3px black outlines with rounded corner joins - Cel-shading technique with sharp shadow boundaries.`,
        artisticPrompt: `Neo-pop artistic interpretation - Transform reference into modern neo-pop art - Bold 3px black outlines with rounded corners - Cel-shading with sharp shadow boundaries - Strict color palette: yellow, red, dark blue, cyan, orange - Multi-layer graphic composition - Paint splashes and geometric elements`,
    },
     'VIBRANT_DIGITAL_COMIC': {
        nameKey: 'style.vibrant_digital_comic.name', emoji: '🎨', badgeKey: 'style.vibrant_digital_comic.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: [ "tags.neon", "tags.outlines", "tags.vector", "tags.contrast", "tags.comics", "tags.flat_composition" ],
        strictPrompt: "Digital comic book illustration in a vibrant poster style. Use a triadic color harmony: bright yellow (#FFFF00), turquoise (#00CED1), or orange-red (#FF4500). All outlines must be sharp, black, and of constant thickness. Matte surface, high contrast. Flat composition.",
        artisticPrompt: "Create a modern digital illustration with the energy of a comic book poster. Use juicy, neon colors—yellow, blue, or orange-red backgrounds contrast with dark objects. Sharp black lines define every shape. Add organic hatching for texture and expressiveness. The mood should be optimistic and slightly ironic, like in pop art. Details are emphasized, the composition is flat and graphic.",
        locks: ['colorVibrance', 'materialTexture', 'subsurfaceScattering', 'particleEffects', 'lightingPreset'],
    },
    'SUNSET_VECTOR_NOIR': {
        nameKey: 'style.sunset_vector_noir.name', emoji: '🌅', badgeKey: 'style.sunset_vector_noir.badge', category: 'GRAPHICS_AND_DESIGN',
        tagKeys: ['tags.silhouette', 'tags.gradient', 'tags.surrealism', 'tags.synthwave', 'tags.fluidity'],
        strictPrompt: `Flat vector illustration style - Deep solid black silhouettes with razor-sharp edges - Vibrant sunset gradient backgrounds (saturated orange, magenta, deep purple, yellow) - Glowing neon symbols and accents - Viscous liquid drip effects and melting geometry.`,
        artisticPrompt: `Mystical digital surrealism - Dreamlike and ethereal atmosphere - A fusion of Afro-futurism and synthwave aesthetics - Evocative and dramatic silhouette art - Sense of mystery and cosmic power - Meditative yet vibrant`,
        locks: ['particleEffects', 'lightingPreset'],
        tipKey: 'style.sunset_vector_noir.tip',
    },
    'KAWAII': { 
        nameKey: 'style.kawaii.name', emoji: '🌸', badgeKey: 'style.kawaii.badge', category: 'ANIME_AND_CARTOONS',
        tagKeys: ['tags.cute', 'tags.soft', 'tags.pastel', 'tags.anime', 'tags.feminine', 'tags.joyful', 'tags.japan'], 
        strictPrompt: `Japanese kawaii cute aesthetic with soft adorable style - Soft rounded shapes with no sharp edges - Pastel color palette - COMPOSITION: DENSE CLUSTER. All sparkles must be connected.`,
        artisticPrompt: `Kawaii cute artistic interpretation - Transform reference into adorable Japanese cute aesthetic - Soft rounded shapes, no sharp edges - Pastel color palette - COMPOSITION RULE: DENSE CLUSTER LAYOUT. All sparkles, hearts, and stars MUST be strictly attached to the main character (e.g., hair clips, held in hands, pattern on clothes). ABSOLUTELY NO FLOATING ELEMENTS. The final image must form one single solid shape - Soft glow effects - Warm inviting colors`,
    },
    'CHILD_DRAWING': { 
        nameKey: 'style.child_drawing.name', emoji: '🖍️', badgeKey: 'style.child_drawing.badge', category: 'ANIME_AND_CARTOONS',
        tagKeys: ['tags.childlike', 'tags.handmade', 'tags.crayons', 'tags.naive', 'tags.simple', 'tags.toy', 'tags.cheerful', 'tags.school', 'tags.artistic'], 
        strictPrompt: `Child-like naive drawing style with crayon and marker aesthetic - Uneven crayon outlines - Bold primary colors with uneven fills - Simplified forms.`,
        artisticPrompt: `Child drawing artistic interpretation - Transform reference into naive child's drawing style - Uneven crayon outlines with pressure variation - Bold primary colors with uneven fills - Simplified disproportionate forms: oversized head, tribe body - Playful, joyful mood`,
        locks: ['lightingPreset'],
    },
    'GRAPHITE_SKETCH': {
        nameKey: 'style.graphite_sketch.name', emoji: '✏️', badgeKey: 'style.graphite_sketch.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.bw', 'tags.sketch', 'tags.graphite', 'tags.handmade', 'tags.hatching', 'tags.paper', 'tags.artistic'],
        strictPrompt: `REALISTIC GRAPHITE PENCIL SKETCH - Render the subject as a detailed graphite pencil drawing - MUST HAVE A CLOSED, CONTINUOUS OUTER CONTOUR LINE separating the subject from the white background. - Use a full range of graphite pencils (HB to 8B) for tonal variation.`,
        artisticPrompt: `ARTISTIC GRAPHITE PENCIL SKETCH - Interpret the reference as an expressive graphite pencil sketch - BOUNDARY RULE: Ensure the subject has a distinct, continuous outline to separate white internal areas (like shirts) from the background. - Use energetic, loose pencil strokes and cross-hatching.`,
        locks: ['colorVibrance'],
    },
    'WOODCUT': { 
        nameKey: 'style.woodcut.name', emoji: '🌳', badgeKey: 'style.woodcut.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.engraving', 'tags.texture', 'tags.bw', 'tags.contrast', 'tags.handmade', 'tags.traditional'], 
        strictPrompt: `Woodcut printing style with carved texture and bold contrasts - Carved wood texture with grain visible - High contrast black and white composition.`,
        artisticPrompt: `Woodcut print artistic style - Convert reference into carved woodcut aesthetic - Visible wood grain texture - High contrast black and white - Bold simplified lines and forms - Handcrafted imperfect quality`,
        locks: ['colorVibrance'],
    },
    'EMBROIDERY': { 
        nameKey: 'style.embroidery.name', emoji: '🧵', badgeKey: 'style.embroidery.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.textile', 'tags.embroidery', 'tags.handmade', 'tags.patterns', 'tags.soft', 'tags.traditional'], 
        strictPrompt: `Embroidery style with stitch texture and thread colors - Visible stitch patterns and thread texture.`,
        artisticPrompt: `Embroidery artistic style - Convert reference into stitched embroidery aesthetic - Visible stitch patterns and thread texture - Fabric weave background - Thread colors with slight sheen - Traditional embroidery motifs`,
    },
    'KNITTED_DIORAMA_ART': {
        nameKey: 'style.knitted_diorama_art.name', emoji: '🧶', badgeKey: 'style.knitted_diorama_art.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.textile_art', 'tags.knitted', 'tags.yarn_sculpture', 'tags.diorama', 'tags.handcrafted', 'tags.soft_texture', 'tags.miniature_scene', 'tags.fiber_art', 'tags.tactile'],
        strictPrompt: `MACRO PHOTOGRAPHY of a Knitted Yarn Diorama. The subject is made ENTIRELY of wool and yarn. Visible knitting stitches, передаваемые текстуры шерсти. 3D relief sculpture.`,
        artisticPrompt: `Handcrafted miniature diorama made ENTIRELY from yarn and wool. Cozy and whimsy atmosphere. Tactile fiber art, comforting and charming mood. Soft natural lighting. Everything is knitted or crocheted.`,
        locks: [],
        tipKey: 'style.knitted_diorama_art.tip'
    },
    'WATERCOLOR_NATURE': { 
        nameKey: 'style.watercolor_nature.name', emoji: '🎨', badgeKey: 'style.watercolor_nature.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.watercolor', 'tags.nature', 'tags.soft', 'tags.transparent', 'tags.airy', 'tags.gentle', 'tags.artistic'], 
        strictPrompt: `Watercolor Illustration style. Wet-on-dry technique for defined edges. Translucent pigment layers. Vibrant nature palette.`,
        artisticPrompt: `Expressive Watercolor Illustration. Soft edges with pigment bloom. Wet-on-dry technique for clarity. Light, airy, and translucent.`,
    },
    'PAPER_CUT': { 
        nameKey: 'style.paper_cut.name', emoji: '📰', badgeKey: 'style.paper_cut.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.newspaper', 'tags.monochrome', 'tags.typography', 'tags.retro', 'tags.bw', 'tags.grunge'], 
        strictPrompt: `Monochrome press printing aesthetic with high contrast - Black and white halftone reproduction - Newsprint grain.`,
        artisticPrompt: `Newspaper cutout artistic style - Transform reference into vintage press printing aesthetic - Black and white halftone reproduction - Newsprint paper texture and grain - High contrast graphic representation - Bold simplified forms`,
        locks: ['colorVibrance'],
    },
    'PAPER_CUT_ART': { 
        nameKey: 'style.paper_cut_art.name', emoji: '✂️', badgeKey: 'style.paper_cut_art.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.paper', 'tags.collage', 'tags.handmade', 'tags.layers', 'tags.pastel', 'tags.warm', 'tags.artistic'], 
        strictPrompt: `Hand-cut paper collage art — Layered construction with visible paper edges - Warm muted palette.`,
        artisticPrompt: `Interpret the reference image as a handcrafted paper-cut collage. All elements rendered as flat, layered pieces of colored paper. Visible paper cut edges with slight organic irregularity. Warm, muted paper palette: ochre, cream, terracotta, teal, soft rust. Subtle cast shadows between layers.`,
    },
    'SCRATCHBOARD_POSTER': {
        nameKey: 'style.scratchboard_poster.name', emoji: '🗡️', badgeKey: 'style.scratchboard_poster.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.punk', 'tags.grunge', 'tags.engraving', 'tags.hatching', 'tags.metal', 'tags.poster', 'tags.monochrome', 'tags.artistic'],
        strictPrompt: `PUNK SCRATCHBOARD POSTER AESTHETIC - High-contrast black and white ONLY - Dense cross-hatching.`,
        artisticPrompt: `PUNK SCRATCHBOARD POSTER INTERPRETATION - Transform the reference into a high-energy scratchboard art piece - Render as if scratching from a black ink surface to reveal a white layer - High-contrast black and white ONLY - Use dense cross-hatching, stippling, and sharp incised lines for texture and value.`,
        locks: ['colorVibrance'],
    },
    'LYRICAL_GRAPHIC': { 
        nameKey: 'style.lyrical_graphic.name', emoji: '📜', badgeKey: 'style.lyrical_graphic.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.poetry', 'tags.melancholy', 'tags.hatching', 'tags.bw', 'tags.documentary', 'tags.nostalgia', 'tags.soviet', 'tags.artistic'], 
        strictPrompt: `Lyrical graphic illustration style - Subdued color palette: shades of gray, sepia.`,
        artisticPrompt: `Lyrical graphic artistic interpretation - Transform reference into melancholic poetic illustration - Expressive trembling pen lines with variable weight - Active cross-hatching for texture and volume - Subdued color palette: grays, sepia, ochre, dirty blues.`,
    },
    'BOTANICAL_ILLUSTRATION': { 
        nameKey: 'style.botanical_illustration.name', emoji: '🌿', badgeKey: 'style.botanical_illustration.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.nature', 'tags.detailed', 'tags.educational', 'tags.accurate'], 
        strictPrompt: `Scientific botanical illustration style - Precise plant morphology - SPECIMEN STUDY.`,
        artisticPrompt: `Botanical illustration artistic style - Transform reference into scientific botanical illustration - Precise plant morphology and anatomical details - Clean line work with subtle color washes - Specimen-like presentation`,
    },
    'CYBERPUNK': { 
        nameKey: 'style.cyberpunk.name', emoji: '🔮', badgeKey: 'style.cyberpunk.badge', category: 'TECHNO_AND_FUTURISM',
        tagKeys: ['tags.futurism', 'tags.technology', 'tags.night', 'tags.neon', 'tags.cyber', 'tags.dark', 'tags.urban'], 
        strictPrompt: `Cyberpunk futuristic aesthetic - Neon glow effects - Metallic surfaces.`,
        artisticPrompt: `Cyberpunk artistic reinterpretation - Transform reference into futuristic tech aesthetic - Neon glow effects and electric colors - Holographic displays, circuit-like patterns - Metallic reflective surfaces`,
    },
    'STEAMPUNK': { 
        nameKey: 'style.steampunk.name', emoji: '⚙️', badgeKey: 'style.steampunk.badge', category: 'TECHNO_AND_FUTURISM',
        tagKeys: ['tags.steampunk', 'tags.victorian', 'tags.mechanisms', 'tags.bronze', 'tags.retro-futurism', 'tags.detailed'], 
        strictPrompt: `STEAMPUNK Victorian machinery aesthetic - Brass and copper metallic surfaces.`,
        artisticPrompt: `Steampunk artistic interpretation - Convert reference into Victorian steampunk aesthetic - Brass and copper metallic surfaces - Gear mechanisms and mechanical details - Victorian era design with tech elements`,
    },
    'NEON_COSMIC_CGI': {
        nameKey: 'style.neon_cosmic_cgi.name', emoji: '🪐', badgeKey: 'style.neon_cosmic_cgi.badge', category: 'TECHNO_AND_FUTURISM',
        tagKeys: ['tags.cosmos', 'tags.neon', 'tags.3d', 'tags.vfx', 'tags.cinematic', 'tags.pixel_art', 'tags.photorealism', 'tags.artistic'],
        strictPrompt: `ULTRA-REALISTIC 3D CGI - Cosmic neon fluid paint material - WET SURFACE - GLOWING NEON LIGHTS AGAINST DEEP BLACK BACKGROUND. High contrast.`,
        artisticPrompt: `Cinematic 3D VFX transformation into neon cosmic universe - Reimagine reference as high-budget 3D CGI visual effects shot - Apply ultra-realistic physically-based rendering (PBR) - Create wet cosmic neon paint material flowing along discord. Glowing lines on dark void.`,
        locks: ['materialTexture', 'subsurfaceScattering', 'particleEffects', 'lightingPreset'],
    },
    'LIQUID': { 
        nameKey: 'style.liquid.name', emoji: '💧', badgeKey: 'style.liquid.badge', category: 'ABSTRACTION_AND_PSYCHEDELIA',
        tagKeys: ['tags.liquid', 'tags.abstraction', 'tags.reflections', 'tags.flowing', 'tags.metal', 'tags.dynamic'], 
        strictPrompt: `Liquid abstract style - Iridescent chrome - molten metal physics.`,
        artisticPrompt: `Liquid abstract artistic interpretation - Transform reference into flowing liquid aesthetic - Render as if sculpted from iridescent, flowing chrome or mercury - Color shifts and iridescent effects`,
    },
    'UFO_PSYCHEDELIC': { 
        nameKey: 'style.ufo_psychedelic.name', emoji: '🛸', badgeKey: 'style.ufo_psychedelic.badge', category: 'ABSTRACTION_AND_PSYCHEDELIA',
        tagKeys: ['tags.ufo', 'tags.cosmos', 'tags.conspiracy', 'tags.psychedelia', 'tags.poster', 'tags.grunge'], 
        strictPrompt: `UFO conspiracy psychedelic art style - Government document grain and texture.`,
        artisticPrompt: `UFO psychedelic artistic style - Transform reference into conspiracy poster aesthetic - Alien abduction poster style - Cosmic colors with conspiracy themes`,
    },
    'ART_DECO': { 
        nameKey: 'style.art_deco.name', emoji: '🏛️', badgeKey: 'style.art_deco.badge', category: 'ARCHITECTURE_AND_MINIMALISM',
        tagKeys: ['tags.elegant', 'tags.geometry', 'tags.luxury', 'tags.architecture', 'tags.1920s', 'tags.symmetry'], 
        strictPrompt: `Art Deco style - Geometric elegance - Vertical symmetry - Luxury materials.`,
        artisticPrompt: `Art Deco artistic reinterpretation - Convert reference into geometric Art Deco style - Strong vertical lines and symmetrical geometric patterns - Streamlined elegant aesthetic`,
    },
    'BRUTALISM': { 
        nameKey: 'style.brutalism.name', emoji: '🏗️', badgeKey: 'style.brutalism.badge', category: 'ARCHITECTURE_AND_MINIMALISM',
        tagKeys: ['tags.architecture', 'tags.minimalism', 'tags.concrete', 'tags.geometry', 'tags.strict', 'tags.urban', 'tags.raw'], 
        strictPrompt: `Brutalist architecture style - Raw concrete textures - Monolithic geometric forms.`,
        artisticPrompt: `Brutalist architectural interpretation - Convert reference into raw brutalist aesthetic - Raw concrete textures and rough surfaces - Monolithic geometric forms with sharp angles - Minimal color palette`,
    },
    'SCANDINAVIAN': { 
        nameKey: 'style.scandinavian.name', emoji: '🌲', badgeKey: 'style.scandinavian.badge', category: 'ARCHITECTURE_AND_MINIMALISM',
        tagKeys: ['tags.minimalism', 'tags.scandinavian', 'tags.nature', 'tags.cozy', 'tags.simple', 'tags.functional'], 
        strictPrompt: `Scandinavian minimalist design - Clean lines - Functional forms.`,
        artisticPrompt: `Scandinavian minimalist artistic interpretation - Transform reference into clean Scandinavian design - Geometric simplicity and clean lines - Natural color palette with wood tones`,
    },
    'STAINED_GLASS': { 
        nameKey: 'style.stained_glass.name', emoji: '🔮', badgeKey: 'style.stained_glass.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.stained_glass', 'tags.colors', 'tags.glass', 'tags.religion', 'tags.light', 'tags.ornament'], 
        strictPrompt: `STAINED_GLASS style - Black lead lines separating color areas - Translucent glass-like colors.`,
        artisticPrompt: `Stained glass artistic interpretation - Transform reference into vibrant stained glass aesthetic - Glowing light from behind to simulate light transmission - Ornamental motifs`,
    },
    'CUSTOM': {
        nameKey: 'style.custom.name', emoji: '🧬', badgeKey: 'style.custom.badge', category: 'ART_TECHNIQUES',
        tagKeys: ['tags.artistic'],
        strictPrompt: 'Custom style from DNA analysis.',
        artisticPrompt: 'Custom artistic interpretation.'
    }
};
