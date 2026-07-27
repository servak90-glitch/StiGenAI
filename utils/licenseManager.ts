
import { License, LicenseFeatures } from '../types';
import { loadLicense, incrementUsage as firestoreIncrement, createLicenseInStore, updateLicenseInStore, FirestoreLicense, isLicenseValid, activateLicenseIfNeeded } from './licenseStore';

const getTrustedTime = (): number => {
    const clientTime = Date.now();
    const storedLastTime = localStorage.getItem('stigen_last_seen_time');
    const lastSeenTime = storedLastTime ? parseInt(storedLastTime, 10) : 0;
    const trustedTime = Math.max(clientTime, lastSeenTime);
    localStorage.setItem('stigen_last_seen_time', trustedTime.toString());
    return trustedTime;
};

const mapFirestoreToAppLicense = (fsLic: FirestoreLicense, trustedTime: number): License => {
    let status: License['status'] = 'active';
    if (!fsLic.isActive) status = 'banned';
    else if (fsLic.expiresAt && trustedTime > fsLic.expiresAt) status = 'expired';
    
    return {
        key: fsLic.token,
        status: status,
        features: {
            allowStickers: fsLic.features.includes('stickers'),
            allowPro: fsLic.features.includes('pro'),
            allowBatch: fsLic.features.includes('batch'),
            allowVector: fsLic.features.includes('vector'),
            allowUpscale: fsLic.features.includes('upscale'),
            allowCards: fsLic.features.includes('cards'),
            allowPrint: fsLic.features.includes('print'),
            allowHarmony: fsLic.features.includes('harmony'),
            allowScanner: fsLic.features.includes('scanner'),
            allowTransposer: fsLic.features.includes('transposer'),
            allowPack: fsLic.features.includes('pack'),
        },
        limits: {
            generations: fsLic.maxGen,
            days: fsLic.daysLimit || 0 
        },
        usage: {
            usedGenerations: fsLic.usedGen
        },
        createdAt: fsLic.createdAt,
        activatedAt: fsLic.activatedAt,
        expiresAt: fsLic.expiresAt
    };
};

export const getLicenseByKey = async (key: string): Promise<License | null> => {
    const trustedTime = getTrustedTime();
    const fsLicense = await loadLicense(key);
    if (!fsLicense) return null;
    return mapFirestoreToAppLicense(fsLicense, trustedTime);
};

export const validateAndActivateLicense = async (key: string): Promise<{ valid: boolean; license?: License; error?: string }> => {
    if (!key) return { valid: false, error: 'Empty key' };
    
    const trustedTime = getTrustedTime();
    let fsLicense = await loadLicense(key);
    if (!fsLicense) return { valid: false, error: 'License key not found.' };

    if (!fsLicense.activatedAt && fsLicense.isActive) {
        const days = fsLicense.daysLimit || 30;
        const activationDate = await activateLicenseIfNeeded(key, days);
        fsLicense.activatedAt = activationDate;
        fsLicense.expiresAt = activationDate + (days * 24 * 60 * 60 * 1000);
    }

    if (!isLicenseValid(fsLicense, trustedTime)) {
        let errorMsg = 'License invalid.';
        if (!fsLicense.isActive) errorMsg = 'License is disabled.';
        else if (fsLicense.expiresAt && trustedTime > fsLicense.expiresAt) errorMsg = 'License expired.';
        else if (fsLicense.maxGen > 0 && fsLicense.usedGen >= fsLicense.maxGen) errorMsg = 'Generation limit reached.';
        return { valid: false, error: errorMsg };
    }

    return { valid: true, license: mapFirestoreToAppLicense(fsLicense, trustedTime) };
};

export const useLicenseCredit = async (key: string): Promise<boolean> => {
    try {
        if (key === 'ADMIN-ACCESS') return true;

        // DEMO LOGIC
        if (key === 'DEMO-SESSION') {
            const usageStr = localStorage.getItem('demoUsage');
            let usage = usageStr ? parseInt(usageStr, 10) : 0;
            // Hardcoded limit of 10 for demo
            if (usage >= 10) return false;
            
            usage++;
            localStorage.setItem('demoUsage', usage.toString());
            return true;
        }

        await firestoreIncrement(key);
        return true; 
    } catch (e) {
        console.error("Credit deduction failed", e);
        return false; 
    }
};

export const updateExistingLicense = async (
    key: string,
    features: LicenseFeatures,
    addGens: number,
    addDays: number
): Promise<void> => {
    const fsLicense = await loadLicense(key);
    if (!fsLicense) throw new Error("License not found");

    const featureList: string[] = [];
    if (features.allowStickers) featureList.push('stickers');
    if (features.allowPro) featureList.push('pro');
    if (features.allowBatch) featureList.push('batch');
    if (features.allowVector) featureList.push('vector');
    if (features.allowUpscale) featureList.push('upscale');
    if (features.allowCards) featureList.push('cards');
    if (features.allowPrint) featureList.push('print');
    if (features.allowHarmony) featureList.push('harmony');
    if (features.allowScanner) featureList.push('scanner');
    if (features.allowTransposer) featureList.push('transposer');
    if (features.allowPack) featureList.push('pack');

    const updates: Partial<FirestoreLicense> = {
        features: featureList,
        maxGen: fsLicense.maxGen + addGens,
        isActive: true
    };

    if (addDays > 0) {
        const dayMs = 24 * 60 * 60 * 1000;
        if (fsLicense.expiresAt) {
            // Если уже активирован - продлеваем от текущей даты окончания или от сейчас (если просрочен)
            const baseTime = Math.max(fsLicense.expiresAt, Date.now());
            updates.expiresAt = baseTime + (addDays * dayMs);
        } else {
            // Если еще не активирован - просто увеличиваем лимит дней ожидания активации
            updates.daysLimit = (fsLicense.daysLimit || 0) + addDays;
        }
    }

    await updateLicenseInStore(key, updates);
};

export const generateNewLicense = async (
    features: License['features'], 
    limits: License['limits']
): Promise<string> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segment = () => Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const key = `${segment()}-${segment()}-${segment()}`;

    const featureList: string[] = [];
    if (features.allowStickers) featureList.push('stickers');
    if (features.allowPro) featureList.push('pro');
    if (features.allowBatch) featureList.push('batch');
    if (features.allowVector) featureList.push('vector');
    if (features.allowUpscale) featureList.push('upscale');
    if (features.allowCards) featureList.push('cards');
    if (features.allowPrint) featureList.push('print');
    if (features.allowHarmony) featureList.push('harmony');
    if (features.allowScanner) featureList.push('scanner');
    if (features.allowTransposer) featureList.push('transposer');
    if (features.allowPack) featureList.push('pack');

    const now = Date.now();
    const newLicense: FirestoreLicense = {
        token: key,
        features: featureList,
        maxGen: limits.generations,
        usedGen: 0,
        createdAt: now,
        daysLimit: limits.days,
        isActive: true
    };

    await createLicenseInStore(newLicense);
    return key;
};
