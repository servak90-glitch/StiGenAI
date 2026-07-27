
import { openDB, DBSchema } from 'idb';
import { Settings, Preset, License, BrandKit, StyleBlueprint, StyleCategoryKey } from '../types';
import { blobUrlToBase64 } from './imageProcessor';

interface StickerHistoryItem {
    id: string;
    timestamp: number;
    imageData: string; // Base64
    prompt: string;
    settings: Settings;
    isFavorite?: boolean;
}

interface PromptCacheItem {
    key: string;
    imageData: string;
    timestamp: number;
}

export interface UserStyle {
    id: string;
    name: string;
    emoji: string;
    category: StyleCategoryKey;
    blueprint: StyleBlueprint;
    timestamp: number;
}

interface StickerDB extends DBSchema {
    history: {
        key: string;
        value: StickerHistoryItem;
        indexes: { 'by-date': number };
    };
    presets: {
        key: string;
        value: Preset;
    };
    licenses: {
        key: string;
        value: License;
    };
    promptCache: {
        key: string;
        value: PromptCacheItem;
    };
    brandKits: {
        key: string;
        value: BrandKit;
    };
    userStyles: {
        key: string;
        value: UserStyle;
    };
}

const DB_NAME = 'sticker-gen-db';
const HISTORY_STORE = 'history';
const PRESETS_STORE = 'presets';
const LICENSES_STORE = 'licenses';
const CACHE_STORE = 'promptCache';
const BRAND_KITS_STORE = 'brandKits';
const USER_STYLES_STORE = 'userStyles';
const MAX_ITEMS = 50;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const initDB = async () => {
    return openDB<StickerDB>(DB_NAME, 7, {
        upgrade(db, oldVersion) {
            if (oldVersion < 1) {
                const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
                store.createIndex('by-date', 'timestamp');
            }
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains(PRESETS_STORE)) {
                    db.createObjectStore(PRESETS_STORE, { keyPath: 'id' });
                }
            }
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains(LICENSES_STORE)) {
                    db.createObjectStore(LICENSES_STORE, { keyPath: 'key' });
                }
            }
            if (oldVersion < 4) {
                if (!db.objectStoreNames.contains(CACHE_STORE)) {
                    db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
                }
            }
            if (oldVersion < 5) {
                if (!db.objectStoreNames.contains(BRAND_KITS_STORE)) {
                    db.createObjectStore(BRAND_KITS_STORE, { keyPath: 'id' });
                }
            }
            if (oldVersion < 6 || oldVersion < 7) {
                if (!db.objectStoreNames.contains(USER_STYLES_STORE)) {
                    db.createObjectStore(USER_STYLES_STORE, { keyPath: 'id' });
                }
            }
        },
    });
};

export const getCachedCardBg = async (key: string): Promise<string | null> => {
    const db = await initDB();
    const item = await db.get(CACHE_STORE, key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_TTL) {
        await db.delete(CACHE_STORE, key);
        return null;
    }
    return item.imageData;
};

export const saveCachedCardBg = async (key: string, imageData: string) => {
    const db = await initDB();
    // Ensure we store Base64 if passed a Blob URL, although cache usually handles direct API output
    let dataToStore = imageData;
    if (imageData.startsWith('blob:')) {
        dataToStore = await blobUrlToBase64(imageData);
    }

    await db.put(CACHE_STORE, {
        key,
        imageData: dataToStore,
        timestamp: Date.now()
    });
};

export const saveToHistory = async (item: Omit<StickerHistoryItem, 'timestamp'>) => {
    try {
        const db = await initDB();
        
        // Convert Blob URL to Base64 for persistent storage
        // Blob URLs are revoked on page reload, so they can't be stored.
        let imageDataToStore = item.imageData;
        if (imageDataToStore.startsWith('blob:')) {
            imageDataToStore = await blobUrlToBase64(imageDataToStore);
        }

        const fullItem: StickerHistoryItem = {
            ...item,
            imageData: imageDataToStore,
            timestamp: Date.now()
        };
        
        await db.put(HISTORY_STORE, fullItem);

        const count = await db.count(HISTORY_STORE);
        if (count > MAX_ITEMS) {
            const cursor = await db.transaction(HISTORY_STORE, 'readwrite').store.index('by-date').openCursor();
            if (cursor) {
                await cursor.delete(); 
            }
        }
        return true;
    } catch (e) {
        console.error("Failed to save to history", e);
        return false;
    }
};

export const getHistory = async (): Promise<StickerHistoryItem[]> => {
    try {
        const db = await initDB();
        return await db.getAllFromIndex(HISTORY_STORE, 'by-date');
    } catch (e) {
        console.error("Failed to get history", e);
        return [];
    }
};

export const deleteFromHistory = async (id: string) => {
    const db = await initDB();
    await db.delete(HISTORY_STORE, id);
};

export const clearHistory = async () => {
    const db = await initDB();
    await db.clear(HISTORY_STORE);
};

// Brand Kits Operations
export const saveBrandKit = async (kit: BrandKit) => {
    const db = await initDB();
    await db.put(BRAND_KITS_STORE, kit);
};

export const getBrandKits = async (): Promise<BrandKit[]> => {
    const db = await initDB();
    return db.getAll(BRAND_KITS_STORE);
};

export const deleteBrandKit = async (id: string) => {
    const db = await initDB();
    await db.delete(BRAND_KITS_STORE, id);
};

// User Styles Operations
export const saveUserStyle = async (style: UserStyle) => {
    const db = await initDB();
    await db.put(USER_STYLES_STORE, style);
};

export const getUserStyles = async (): Promise<UserStyle[]> => {
    const db = await initDB();
    return db.getAll(USER_STYLES_STORE);
};

export const deleteUserStyle = async (id: string) => {
    const db = await initDB();
    await db.delete(USER_STYLES_STORE, id);
};
