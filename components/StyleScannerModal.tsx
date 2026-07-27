
import React, { useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { GoogleGenAI } from "@google/genai";
import { getEffectiveApiKey } from '../utils/apiKeyManager';
import { STYLE_SCANNER_PROMPT } from '../prompts';

interface StyleScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StyleScannerModal: React.FC<StyleScannerModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [referencePrompt, setReferencePrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [resultJson, setResultJson] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Cast to File[] to ensure typescript knows these are Files (which extend Blob)
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        // Limit total images to 4
        const remainingSlots = 4 - selectedImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        if (filesToProcess.length === 0) {
            setError(t('scanner.maxImagesReached'));
            return;
        }

        const newImages: string[] = [];
        let processedCount = 0;

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newImages.push(reader.result as string);
                processedCount++;
                if (processedCount === filesToProcess.length) {
                    setSelectedImages(prev => [...prev, ...newImages]);
                    setError(null);
                    setResultJson('');
                }
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input so same file can be selected again if deleted
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleScan = async () => {
        if (selectedImages.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const apiKey = getEffectiveApiKey(); 
            if (!apiKey) {
                throw new Error("API Key not configured. Please enter your Gemini API key.");
            }

            const ai = new GoogleGenAI({ apiKey });
            
            // Construct parts: Images first
            const parts: any[] = [];
            
            selectedImages.forEach(imgData => {
                const base64Data = imgData.split(',')[1];
                const mimeType = imgData.split(';')[0].split(':')[1];
                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                });
            });

            // Add text prompt part
            let promptText = STYLE_SCANNER_PROMPT;
            if (referencePrompt.trim()) {
                promptText += `\n\nUSER REFERENCE PROMPT (HINT): "${referencePrompt.trim()}"\nUse this hint to understand the user's intent, but prioritize visual evidence from the images.`;
            }

            parts.push({ text: promptText });

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-preview',
                contents: {
                    parts: parts
                },
                config: {
                    temperature: 0.4,
                    responseMimeType: "application/json"
                }
            });

            const text = response.text;
            if (text) {
                // Robust Parsing: Extract JSON structure if AI adds conversational text
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const cleanedText = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, '').trim();
                setResultJson(cleanedText);
            } else {
                throw new Error("Empty response from AI");
            }

        } catch (err: any) {
            console.error("Scanning failed:", err);
            setError(err.message || "Failed to scan. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(resultJson);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center bg-indigo-600 text-white flex-shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            👁️ {t('scanner.title')}
                        </h2>
                        <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">{t('scanner.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    {/* Left: Inputs */}
                    <div className="w-full lg:w-5/12 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-slate-50 overflow-y-auto">
                        
                        {/* Image Upload Area */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-slate-700">{t('scanner.imagesLabel')} ({selectedImages.length}/4)</span>
                                {selectedImages.length > 0 && (
                                    <button onClick={() => setSelectedImages([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
                                        {t('scanner.clearImages')}
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-300 group">
                                        <img src={img} alt={`ref-${idx}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {selectedImages.length < 4 && (
                                    <label className="aspect-square flex flex-col items-center justify-center cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            accept="image/*" 
                                            multiple 
                                            className="hidden" 
                                            onChange={handleImageUpload} 
                                        />
                                        <span className="text-2xl text-indigo-400">+</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Reference Prompt Input */}
                        <div className="mb-6 flex-grow">
                             <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('scanner.promptLabel')} <span className="text-slate-400 font-normal">({t('scanner.optional')})</span>
                            </label>
                            <textarea 
                                value={referencePrompt}
                                onChange={(e) => setReferencePrompt(e.target.value)}
                                placeholder={t('scanner.promptPlaceholder')}
                                className="w-full h-32 p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                            />
                             <p className="text-xs text-slate-500 mt-2">
                                {t('scanner.promptHint')}
                            </p>
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={selectedImages.length === 0 || isLoading}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 mt-auto
                                ${selectedImages.length === 0 || isLoading 
                                    ? 'bg-slate-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('scanner.analyzing')}
                                </span>
                            ) : (
                                t('scanner.action')
                            )}
                        </button>
                        
                        {error && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 text-xs rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right: Output */}
                    <div className="w-full lg:w-7/12 p-0 bg-[#1e1e1e] flex flex-col relative min-h-[300px] lg:min-h-0">
                        <div className="flex justify-between items-center p-3 bg-[#252526] border-b border-[#333] flex-shrink-0">
                            <span className="text-slate-400 text-xs font-mono">{t('scanner.jsonResult')}</span>
                            {resultJson && (
                                <button 
                                    onClick={copyToClipboard}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                                >
                                    {t('preview.copy')}
                                </button>
                            )}
                        </div>
                        <div className="flex-grow overflow-auto p-4 custom-scrollbar">
                            {resultJson ? (
                                <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                                    {resultJson}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                                    <div className="text-4xl mb-3 opacity-20">🧬</div>
                                    <p>{t('scanner.emptyState')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StyleScannerModal;
