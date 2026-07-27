
import { initDB } from './db';
import { Preset } from '../types';

const STORE_NAME = 'presets';

export const getAllPresets = async (): Promise<Preset[]> => {
    try {
        const db = await initDB();
        return await db.getAll(STORE_NAME);
    } catch (e) {
        console.error("Failed to load presets", e);
        return [];
    }
};

export const savePreset = async (preset: Preset): Promise<boolean> => {
    try {
        const db = await initDB();
        await db.put(STORE_NAME, preset);
        return true;
    } catch (e) {
        console.error("Failed to save preset", e);
        return false;
    }
};

export const deletePreset = async (id: string): Promise<void> => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
    } catch (e) {
        console.error("Failed to delete preset", e);
    }
};
