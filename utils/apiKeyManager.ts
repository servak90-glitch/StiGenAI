import { GoogleGenAI } from '@google/genai';

const CUSTOM_API_KEY_STORAGE = 'custom_gemini_api_key';

export const getCustomApiKey = (): string => {
    return localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
};

export const setCustomApiKey = (key: string): void => {
    const trimmed = key.trim();
    if (trimmed) {
        localStorage.setItem(CUSTOM_API_KEY_STORAGE, trimmed);
    } else {
        localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
    }
    // Dispatch a custom event so UI components can re-render if needed
    window.dispatchEvent(new Event('apiKeyUpdated'));
};

export const getEffectiveApiKey = (): string => {
    const customKey = getCustomApiKey();
    if (customKey) return customKey;
    // Fallback to build-time process.env.API_KEY
    return (process.env as any).API_KEY || '';
};

export const isOpenAIKey = (key: string): boolean => {
    return key.trim().startsWith('sk-');
};

export const isApiKeyConfigured = (): boolean => {
    const key = getEffectiveApiKey();
    return !!key && key.length > 5;
};

export const getGenAiClient = (): GoogleGenAI => {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
        throw new Error('API ключ не задан. Пожалуйста, укажите ваш Google Gemini API ключ в настройках на главном экране.');
    }
    return new GoogleGenAI({ apiKey });
};
