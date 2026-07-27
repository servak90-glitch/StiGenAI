
import React, { useState } from 'react';
import { generateNewLicense, getLicenseByKey, updateExistingLicense } from '../utils/licenseManager';
import { LicenseFeatures, LicenseLimits } from '../types';

interface AdminLicenseGeneratorProps {
    onClose: () => void;
    isOpen?: boolean;
}

const PRESETS = {
    'BASIC': { days: 30, gens: 200, stickers: true, pro: false, vector: false, batch: false, cards: false, print: false, harmony: false, scanner: false, transposer: false, pack: false, label: 'Базовый (Стикеры)' },
    'STANDARD': { days: 30, gens: 500, stickers: true, pro: false, vector: true, batch: false, cards: false, print: true, harmony: false, scanner: false, transposer: false, pack: true, label: 'Стандарт (+Pack)' },
    'PRO_CREATOR': { days: 30, gens: 1000, stickers: true, pro: true, vector: true, batch: true, cards: true, print: true, harmony: true, scanner: true, transposer: true, pack: true, label: 'Pro (Полный)' },
    'TRIAL': { days: 1, gens: 10, stickers: true, pro: false, vector: true, batch: false, cards: false, print: false, harmony: false, scanner: false, transposer: false, pack: false, label: 'Тест (1 день)' },
    'UPSCALE_ONLY': { days: 30, gens: 100, stickers: false, pro: false, vector: false, batch: false, cards: false, print: false, harmony: false, scanner: false, transposer: false, pack: false, upscaleOnly: true, label: 'Только Апскейл' },
    'VIP_YEAR': { days: 365, gens: 10000, stickers: true, pro: true, vector: true, batch: true, cards: true, print: true, harmony: true, scanner: true, transposer: true, pack: true, label: 'VIP (Год)' }
};

const AdminLicenseGenerator: React.FC<AdminLicenseGeneratorProps> = ({ onClose, isOpen = true }) => {
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchKey, setSearchKey] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Form State
    const [limits, setLimits] = useState<LicenseLimits>({ days: 30, generations: 500 });
    const [features, setFeatures] = useState<LicenseFeatures>({
        allowStickers: true,
        allowPro: false,
        allowBatch: true,
        allowVector: true,
        allowUpscale: true,
        allowCards: true,
        allowPrint: true,
        allowHarmony: true,
        allowScanner: true,
        allowTransposer: false,
        allowPack: true
    });

    if (!isOpen) return null;

    const handleLoadKey = async () => {
        if (!searchKey.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const existing = await getLicenseByKey(searchKey.trim().toUpperCase());
            if (existing) {
                setFeatures(existing.features);
                // Для режима редактирования сбрасываем счетчики в 0, 
                // так как в UI они теперь означают "Сколько добавить"
                setLimits({ days: 0, generations: 0 });
                setIsEditMode(true);
                setGeneratedKey(null);
            } else {
                setError("Ключ не найден");
            }
        } catch (err) {
            setError("Ошибка при поиске ключа");
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = (key: keyof typeof PRESETS) => {
        const p = PRESETS[key] as any;
        setLimits({ days: p.days, generations: p.gens });
        
        if (p.upscaleOnly) {
             setFeatures({
                allowStickers: false, allowPro: false, allowBatch: false, allowVector: false,
                allowUpscale: true, allowCards: false, allowPrint: false, allowHarmony: false, allowScanner: false, allowTransposer: false, allowPack: false
            });
        } else {
            setFeatures({
                allowStickers: p.stickers,
                allowPro: p.pro,
                allowBatch: p.batch,
                allowVector: p.vector,
                allowUpscale: true,
                allowCards: p.cards,
                allowPrint: p.print,
                allowHarmony: p.harmony,
                allowScanner: p.scanner,
                allowTransposer: p.transposer,
                allowPack: p.pack
            });
        }
    };

    const handleToggleFeature = (key: keyof LicenseFeatures) => {
        setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAction = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isEditMode) {
                await updateExistingLicense(searchKey.trim().toUpperCase(), features, limits.generations, limits.days);
                setGeneratedKey(searchKey.trim().toUpperCase());
                alert("Лицензия успешно обновлена!");
            } else {
                const key = await generateNewLicense(features, limits);
                setGeneratedKey(key);
            }
        } catch (err: any) {
            setError(err.message || "Ошибка операции");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setSearchKey('');
        setGeneratedKey(null);
        setError(null);
        setLimits({ days: 30, generations: 500 });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                    <h2 className="font-bold text-lg">🔑 {isEditMode ? 'Редактирование' : 'Генератор'} Лицензий</h2>
                    <button onClick={onClose} className="hover:text-red-300 transition">✕</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Search / Load Section */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Управление существующим ключом</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="XXXX-XXXX-XXXX"
                                value={searchKey}
                                onChange={e => setSearchKey(e.target.value.toUpperCase())}
                                className="flex-1 p-2 bg-white border border-slate-300 rounded-lg font-mono text-sm focus:border-indigo-500 outline-none"
                            />
                            <button 
                                onClick={handleLoadKey}
                                disabled={loading || !searchKey}
                                className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs hover:bg-indigo-200 transition-colors disabled:opacity-50"
                            >
                                {loading ? '...' : 'ЗАГРУЗИТЬ'}
                            </button>
                            {isEditMode && (
                                <button onClick={resetForm} className="px-3 py-2 text-slate-400 hover:text-red-500">✕</button>
                            )}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Presets */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Быстрые пресеты</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(PRESETS).map(([k, v]) => (
                                <button 
                                    key={k}
                                    onClick={() => applyPreset(k as any)}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition uppercase"
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                                {isEditMode ? 'Добавить дней' : 'Срок (Дней)'}
                            </label>
                            <input 
                                type="number" 
                                value={limits.days}
                                onChange={e => setLimits(l => ({...l, days: parseInt(e.target.value) || 0}))}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                                {isEditMode ? 'Добавить генераций' : 'Лимит генераций'}
                            </label>
                            <input 
                                type="number" 
                                value={limits.generations}
                                onChange={e => setLimits(l => ({...l, generations: parseInt(e.target.value) || 0}))}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Features Matrix */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Доступ к модулям</label>
                        <div className="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowStickers} onChange={() => handleToggleFeature('allowStickers')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">✨ Базовая генерация (Стикеры)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowPro} onChange={() => handleToggleFeature('allowPro')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">💎 Pro Model (Gemini 3)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowBatch} onChange={() => handleToggleFeature('allowBatch')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">📦 Пакетная генерация (внутри генератора)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowPack} onChange={() => handleToggleFeature('allowPack')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">📦 Стикерпак (Sticker Pack)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowTransposer} onChange={() => handleToggleFeature('allowTransposer')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">🧬 Транспозер стилей (Style Transposer)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowVector} onChange={() => handleToggleFeature('allowVector')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">✂️ Векторизация (SVG)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowUpscale} onChange={() => handleToggleFeature('allowUpscale')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">🚀 4x Апскейл</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowCards} onChange={() => handleToggleFeature('allowCards')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">📇 Визитки (Business Cards)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowPrint} onChange={() => handleToggleFeature('allowPrint')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">🖨️ Центр печати (Print Hub)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowHarmony} onChange={() => handleToggleFeature('allowHarmony')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">🎨 Фирменный стиль (Brand Kit)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={features.allowScanner} onChange={() => handleToggleFeature('allowScanner')} />
                                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">👁️ Сканер стиля (Vision Scan)</span>
                            </label>
                        </div>
                    </div>

                    {/* Result Area */}
                    {generatedKey && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center space-y-2 animate-fade-in">
                            <p className="text-xs text-green-800 font-bold uppercase">{isEditMode ? 'Ключ обновлен' : 'Ключ создан успешно'}</p>
                            <div className="text-2xl font-mono font-black text-slate-800 tracking-widest select-all bg-white p-3 rounded-lg border border-green-100 shadow-inner">
                                {generatedKey}
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    alert("Скопировано!");
                                }}
                                className="text-xs text-green-700 underline cursor-pointer hover:text-green-900"
                            >
                                Копировать в буфер
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center animate-fade-in">
                            <p className="text-sm text-red-800 font-bold">⚠️ {error}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <button 
                        onClick={handleAction} 
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95
                            ${loading ? 'bg-slate-300 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}
                        `}
                    >
                        {loading ? 'Обработка...' : (isEditMode ? 'Обновить лицензию' : 'Создать новый ключ')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLicenseGenerator;
