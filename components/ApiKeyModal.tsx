import React, { useState, useEffect } from 'react';
import { getCustomApiKey, setCustomApiKey, isOpenAIKey, getEffectiveApiKey } from '../utils/apiKeyManager';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [savedNotice, setSavedNotice] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setApiKeyInput(getCustomApiKey() || getEffectiveApiKey() || '');
            setSavedNotice(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentCustom = getCustomApiKey();
    const activeKey = getEffectiveApiKey();
    const isSkKey = isOpenAIKey(apiKeyInput);

    const handleSave = () => {
        setCustomApiKey(apiKeyInput);
        setSavedNotice('✓ API ключ успешно сохранён!');
        setTimeout(() => {
            setSavedNotice(null);
            onClose();
        }, 1200);
    };

    const handleReset = () => {
        setCustomApiKey('');
        setApiKeyInput(getEffectiveApiKey() || '');
        setSavedNotice('✓ Сброшено на стандартный системный ключ');
        setTimeout(() => setSavedNotice(null), 1500);
    };

    const maskKey = (key: string) => {
        if (!key) return 'Не задан';
        if (key.length <= 8) return '••••••••';
        return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col gap-5"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold shadow-inner">
                            🔑
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                Настройка API ключа
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Укажите свой персональный Google Gemini API ключ
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Status Badge */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Текущий активный ключ</span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {maskKey(activeKey)}
                        </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        currentCustom 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' 
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300'
                    }`}>
                        {currentCustom ? 'Свой ключ' : 'Системный'}
                    </span>
                </div>

                {/* Notice for OpenAI ChatGPT Keys */}
                {isSkKey && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                        <div className="flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                            <span className="text-base">⚠️</span>
                            <div>
                                Обнаружен API ключ OpenAI / ChatGPT (начинается с <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">sk-</code>)
                            </div>
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed pl-6">
                            Данное приложение разработано для работы с визуальными ИИ-моделями <strong>Google Gemini (Gemini 2.5 & Imagen 3)</strong>. Ключи OpenAI не будут работать. 
                        </p>
                        <div className="pl-6 pt-1">
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                            >
                                🚀 Получить бесплатный API ключ Gemini (Google AI Studio) ↗
                            </a>
                        </div>
                    </div>
                )}

                {/* Key Input */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <label htmlFor="gemini-api-key-input">Введите ваш Google Gemini API Key:</label>
                        <button 
                            onClick={() => setShowKey(!showKey)}
                            className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                            {showKey ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>
                    <div className="relative">
                        <input 
                            id="gemini-api-key-input"
                            type={showKey ? 'text' : 'password'}
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>

                {/* Helpful instructions */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                        💡 Как получить API ключ за 30 секунд:
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                        <li>Перейдите на бесплатный сайт <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold underline">Google AI Studio ↗</a></li>
                        <li>Нажмите кнопку <strong>"Create API key"</strong></li>
                        <li>Скопируйте ключ (начинается на <code className="font-mono">AIzaSy...</code>) и вставьте выше.</li>
                    </ol>
                </div>

                {savedNotice && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center animate-fade-in">
                        {savedNotice}
                    </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {currentCustom ? (
                        <button
                            onClick={handleReset}
                            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Сбросить ключ
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!apiKeyInput.trim()}
                            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                        >
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
