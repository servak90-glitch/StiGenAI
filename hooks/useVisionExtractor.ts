
import { GoogleGenAI, Type } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { CardData } from '../types';

export const useVisionExtractor = () => {
    const extractBrandData = async (base64Image: string): Promise<Partial<CardData>> => {
        const ai = new GoogleGenAI({ apiKey: getEffectiveApiKey() });
        
        const systemInstruction = `You are a high-end corporate brand identity extractor. 
Analyze the provided image (business card, brand board, or screenshot) and extract all contact and branding details.
If information is missing, leave it as an empty string. 
Identify the dominant corporate accent color as a HEX code.
Format the output as JSON according to the schema provided.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: base64Image.split(',')[1],
                        },
                    },
                    { text: "Extract brand and contact information from this image." }
                ],
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        company: { type: Type.STRING },
                        companyDescription: { type: Type.STRING, description: "One sentence describing the company's industry and style based on the visual." },
                        slogan: { type: Type.STRING },
                        name: { type: Type.STRING },
                        position: { type: Type.STRING },
                        address: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                        website: { type: Type.STRING },
                        telegram: { type: Type.STRING },
                        instagram: { type: Type.STRING },
                        whatsapp: { type: Type.STRING },
                        accentColor: { type: Type.STRING, description: "HEX color code of the primary brand color" }
                    }
                }
            }
        });

        try {
            return JSON.parse(response.text || '{}');
        } catch (e) {
            console.error("Vision Extraction JSON Parse Error", e);
            return {};
        }
    };

    return { extractBrandData };
};
