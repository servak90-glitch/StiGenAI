
// This file is a stub. The AI background removal feature has been disabled
// to improve performance and stability.

export const biRefNetService = {
    segment: async (base64: string) => {
        console.warn("AI Background Removal is disabled. Using fallback.");
        return base64;
    }
};
