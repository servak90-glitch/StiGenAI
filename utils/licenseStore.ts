
import { doc, getDoc, updateDoc, increment, setDoc, enableNetwork, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

// ==================== TYPES ====================
export interface FirestoreLicense {
  token: string;
  features: string[]; 
  maxGen: number;
  usedGen: number;
  expiresAt?: number; 
  createdAt: number;
  activatedAt?: number; 
  daysLimit?: number;   
  isActive: boolean;
}

// ==================== NETWORK INITIALIZATION ====================
let networkInitialized = false;

async function ensureNetworkEnabled() {
  if (networkInitialized) return;
  try {
    if (typeof window !== 'undefined') {
        await enableNetwork(db);
        networkInitialized = true;
    }
  } catch (e) {
    console.warn("Failed to enable Firestore network", e);
  }
}

// ==================== LICENSE OPERATIONS ====================

export const loadLicense = async (token: string): Promise<FirestoreLicense | null> => {
  if (!token) return null;
  await ensureNetworkEnabled();
  try {
    const docRef = doc(db, "licenses", token);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreLicense;
    }
    return null;
  } catch (error: any) {
    console.error("Error loading license:", error);
    return null;
  }
};

export const activateLicenseIfNeeded = async (token: string, daysLimit: number): Promise<number> => {
  await ensureNetworkEnabled();
  const docRef = doc(db, "licenses", token);
  
  await updateDoc(docRef, {
    activatedAt: serverTimestamp()
  });

  const snap = await getDoc(docRef);
  const data = snap.data();
  const serverActivatedAt = data?.activatedAt instanceof Timestamp 
    ? data.activatedAt.toMillis() 
    : Date.now();

  const expiresAt = serverActivatedAt + (daysLimit * 24 * 60 * 60 * 1000);
  await updateDoc(docRef, {
    expiresAt: expiresAt
  });

  return serverActivatedAt;
};

export const createLicenseInStore = async (license: FirestoreLicense): Promise<void> => {
  try {
    await ensureNetworkEnabled();
    const docRef = doc(db, "licenses", license.token);
    await setDoc(docRef, license);
  } catch (error) {
    console.error("Error creating license:", error);
    throw error;
  }
};

export const updateLicenseInStore = async (token: string, updates: Partial<FirestoreLicense>): Promise<void> => {
  try {
    await ensureNetworkEnabled();
    const docRef = doc(db, "licenses", token);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating license:", error);
    throw error;
  }
};

export const incrementUsage = async (token: string): Promise<void> => {
  if (!token) return;
  try {
    await ensureNetworkEnabled();
    const docRef = doc(db, "licenses", token);
    await updateDoc(docRef, {
      usedGen: increment(1)
    });
  } catch (error) {
    console.warn("Error incrementing usage:", error);
  }
};

export const isLicenseValid = (license: FirestoreLicense | null, trustedTime: number): boolean => {
  if (!license) return false;
  if (!license.isActive) return false;

  if (license.maxGen > 0 && license.usedGen >= license.maxGen) {
    return false;
  }

  if (license.expiresAt && trustedTime > license.expiresAt) {
    return false;
  }
  
  return true;
};
