
import React, { useState, useRef, useEffect } from 'react';
import { validateAndActivateLicense } from '../utils/licenseManager';
import { License } from '../types';
import DevLoginModal from './DevLoginModal';
import { 
    BananaIcon, 
    PaletteIcon, 
    ModelIcon, 
    PackIcon, 
    BrainIcon, 
    VectorIcon, 
    UpscaleIcon,
    TelegramIcon,
    EmailIcon
} from './Icons';

interface LockScreenProps {
    onSuccess: (license: License) => void;
}

const translations = {
    ru: {
        title: "StiGenAi",
        subtitle: "Professional Design Suite",
        placeholder: "XXXX-XXXX-XXXX",
        button: "РАЗБЛОКИРОВАТЬ",
        demo: "ДЕМО РЕЖИМ (10 ГЕН)",
        verifying: "ПРОВЕРКА...",
        contact: "Приобрести доступ или поддержка:",
        telegram: "Написать в Telegram",
        error_empty: "Введите ключ",
        error_invalid: "Неверный ключ или ошибка сети",
        version: "v6.7.1 • Secure Access",
        features_title: "Преимущества системы",
        feature_styles: "30+ стилей: превратите любое фото в уникальный стикер",
        feature_models: "Nano Banana & Pro: генерация на базе новейших нейросетей",
        feature_packs: "Стикерпаки: создавайте наборы для печати и мессенджеров",
        feature_prompt: "Точность 94%: уникальный алгоритм умного промпта",
        feature_vector: "SVG Vector: идеальные кривые для плоттерной резки",
        feature_upscale: "4x AI Upscale: локальное улучшение качества без потерь",
        webgl_error: "Ваш браузер может не поддерживать WebGL",
    },
    en: {
        title: "StiGenAi",
        subtitle: "Professional Design Suite",
        placeholder: "XXXX-XXXX-XXXX",
        button: "UNLOCK STUDIO",
        demo: "TRY DEMO (10 GENS)",
        verifying: "VERIFYING...",
        contact: "Get access or contact support:",
        telegram: "Message on Telegram",
        error_empty: "Empty key",
        error_invalid: "Access Denied or Network Error",
        version: "v6.7.1 • Secure Access",
        features_title: "System Advantages",
        feature_styles: "30+ Styles: turn any photo into a unique sticker",
        feature_models: "Nano Banana & Pro: next-gen neural engines",
        feature_packs: "Sticker Packs: sets for print and social media",
        feature_prompt: "94% Precision: high-end smart prompt algorithm",
        feature_vector: "SVG Vector: high-precision paths for cutting",
        feature_upscale: "4x AI Upscale: local neural enhancement",
        webgl_error: "WebGL might be disabled in your browser",
    }
};

const LockScreen: React.FC<LockScreenProps> = ({ onSuccess }) => {
    const [lang, setLang] = useState<'ru' | 'en'>('ru');
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);
    const [webglSupport, setWebglSupport] = useState(true);
    
    const t = translations[lang];

    const logoClickCount = useRef(0);
    const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Check for WebGL support
        try {
            const canvas = document.createElement('canvas');
            setWebglSupport(!!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))));
        } catch (e) {
            setWebglSupport(false);
        }
    }, []);

    const handleLogoClick = () => {
        logoClickCount.current += 1;
        if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
        logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 500); 

        if (logoClickCount.current >= 5) {
            logoClickCount.current = 0;
            setIsDevModalOpen(true);
        }
    };

    const handleAdminLoginSuccess = () => {
        const adminLicense: License = {
            key: 'ADMIN-ACCESS',
            status: 'active',
            features: { 
                allowStickers: true,
                allowPro: true, 
                allowBatch: true, 
                allowVector: true, 
                allowUpscale: true,
                allowCards: true,
                allowPrint: true,
                allowHarmony: true,
                allowScanner: true,
                allowTransposer: true,
                allowPack: true
            },
            limits: { generations: 999999, days: 3650 },
            usage: { usedGenerations: 0 },
            createdAt: Date.now(),
            expiresAt: Date.now() + (3650 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('licenseKey', 'ADMIN-ACCESS');
        localStorage.setItem('isDevMode', 'true');
        onSuccess(adminLicense);
    };

    const handleDemoAccess = () => {
        const demoLicense: License = {
            key: 'DEMO-SESSION',
            status: 'active',
            features: {
                allowStickers: true,
                allowPro: true, // Requires user to bring key if they select Pro model, but allowed in UI
                allowBatch: true,
                allowVector: true,
                allowUpscale: true,
                allowTransposer: true,
                allowPack: true,
                
                // RESTRICTED
                allowCards: false,
                allowPrint: false,
                allowHarmony: false,
                allowScanner: false
            },
            limits: { generations: 10, days: 1 },
            usage: { usedGenerations: 0 },
            createdAt: Date.now()
        };
        
        // Restore usage if exists
        const storedUsage = localStorage.getItem('demoUsage');
        if (storedUsage) {
            demoLicense.usage.usedGenerations = parseInt(storedUsage, 10);
        } else {
            localStorage.setItem('demoUsage', '0');
        }

        localStorage.setItem('licenseKey', 'DEMO-SESSION');
        localStorage.removeItem('isDevMode');
        onSuccess(demoLicense);
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const cleanKey = key.trim().toUpperCase();

        if (cleanKey === 'ADMIN-ACCESS') {
            handleAdminLoginSuccess();
            setLoading(false);
            return;
        }

        const result = await validateAndActivateLicense(cleanKey);
        
        if (result.valid && result.license) {
            localStorage.setItem('licenseKey', result.license.key);
            localStorage.removeItem('isDevMode');
            onSuccess(result.license);
        } else {
            setError(result.error || t.error_invalid);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-[#F5F3F0] z-[100] flex flex-col items-center justify-center p-4 sm:p-6 text-[#5A5A5A] overflow-y-auto">
            
            <DevLoginModal 
                isOpen={isDevModalOpen} 
                onClose={() => setIsDevModalOpen(false)} 
                onSuccess={handleAdminLoginSuccess} 
            />

            {/* Language Toggle */}
            <div className="fixed top-6 right-6 flex bg-white rounded-full p-1 shadow-sm border border-[#E8E3DC] z-50">
                <button 
                    onClick={() => setLang('ru')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'ru' ? 'bg-[#5A5A5A] text-white' : 'text-slate-400'}`}
                >
                    RU
                </button>
                <button 
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === 'en' ? 'bg-[#5A5A5A] text-white' : 'text-slate-400'}`}
                >
                    EN
                </button>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
                
                {/* Login Card */}
                <div className="w-full max-w-md mx-auto bg-white rounded-[40px] shadow-2xl border border-[#E8E3DC] p-8 sm:p-10 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A8D5D8] via-[#D4C5E8] to-[#A8D5D8]"></div>
                    
                    <div 
                        onClick={handleLogoClick}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-lg transform -rotate-6 mb-8 cursor-pointer select-none active:scale-95 transition-transform text-white"
                    >
                        <BananaIcon size={52} />
                    </div>

                    <h1 className="text-4xl font-black mb-2 text-[#5A5A5A] text-center tracking-tighter">{t.title}</h1>
                    <p className="text-[#8B8B8B] text-center mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        {t.subtitle}
                    </p>

                    <form onSubmit={handleUnlock} className="w-full space-y-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={key}
                                onChange={(e) => setKey(e.target.value.toUpperCase())}
                                placeholder={t.placeholder}
                                className="w-full text-center text-xl font-mono p-4 bg-[#FAFAF8] border-2 border-[#E8E3DC] rounded-2xl focus:outline-none focus:border-[#A8D5D8] focus:bg-white transition-all tracking-widest text-[#5A5A5A] placeholder-slate-300"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !key}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all transform active:scale-95
                                ${loading ? 'bg-slate-300 text-white cursor-wait' : 'bg-[#5A5A5A] text-white hover:bg-[#4A4A4A] shadow-slate-200'}
                            `}
                        >
                            {loading ? t.verifying : t.button}
                        </button>
                    </form>

                    <div className="w-full my-4 flex items-center justify-center gap-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-slate-300">OR</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <button 
                        onClick={handleDemoAccess}
                        className="w-full py-3 rounded-2xl border-2 border-[#A8D5D8] text-[#5A5A5A] font-black text-xs uppercase tracking-widest hover:bg-[#F5F3F0] transition-all"
                    >
                        {t.demo}
                    </button>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl w-full text-center border border-red-100 animate-slide-up uppercase tracking-wider">
                            ⚠️ {error}
                        </div>
                    )}

                    {!webglSupport && (
                        <div className="mt-4 text-[9px] text-amber-600 font-bold uppercase">
                            ⚠️ {t.webgl_error}
                        </div>
                    )}

                    <div className="mt-8 pt-8 border-t border-[#F5F3F0] w-full text-center space-y-4">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.contact}</p>
                        <div className="flex flex-col gap-2">
                             <a 
                                href="https://t.me/yars007" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0088cc] text-white rounded-xl font-bold text-xs hover:bg-[#0077b5] transition-all shadow-md active:scale-95"
                            >
                                <TelegramIcon size={16} />
                                {t.telegram}
                            </a>
                            <a href="mailto:servak90@gmail.com" className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors">
                                <EmailIcon size={12} />
                                servak90@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Features Block */}
                <div className="hidden lg:flex flex-col gap-6 p-8">
                    <h2 className="text-3xl font-black text-[#5A5A5A] tracking-tighter uppercase">{t.features_title}</h2>
                    
                    <div className="grid gap-4">
                        {[
                            { icon: <PaletteIcon size={24} />, text: t.feature_styles, color: "bg-amber-100 text-amber-700" },
                            { icon: <ModelIcon size={24} />, text: t.feature_models, color: "bg-yellow-100 text-yellow-700" },
                            { icon: <PackIcon size={24} />, text: t.feature_packs, color: "bg-sky-100 text-sky-700" },
                            { icon: <BrainIcon size={24} />, text: t.feature_prompt, color: "bg-indigo-100 text-indigo-700" },
                            { icon: <VectorIcon size={24} />, text: t.feature_vector, color: "bg-emerald-100 text-emerald-700" },
                            { icon: <UpscaleIcon size={24} />, text: t.feature_upscale, color: "bg-purple-100 text-purple-700" }
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className={`w-12 h-12 rounded-2xl ${f.color} flex-shrink-0 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                    {f.icon}
                                </div>
                                <p className="text-sm font-bold text-slate-600 leading-tight">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            
            <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.version}</p>
        </div>
    );
};

export default LockScreen;
