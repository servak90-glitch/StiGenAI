
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
    BananaIcon, 
    PackIcon, 
    BrainIcon, 
    VectorIcon, 
    UpscaleIcon,
    GuideIcon
} from './Icons';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('welcome');

    if (!isOpen) return null;

    const sections = [
        { id: 'welcome', icon: <span className="text-xl">👋</span>, label: t('guide.menu.welcome') },
        { id: 'generator', icon: <BananaIcon size={20} />, label: t('guide.menu.generator') },
        { id: 'pack', icon: <PackIcon size={20} />, label: t('guide.menu.pack') },
        { id: 'transposer', icon: <BrainIcon size={20} />, label: t('guide.menu.transposer') },
        { id: 'upscaler', icon: <UpscaleIcon size={20} />, label: t('guide.menu.upscaler') },
        { id: 'vector', icon: <VectorIcon size={20} />, label: t('guide.menu.vector') },
    ];

    const getActiveContent = (id: string) => {
        const keyMap: Record<string, { title: string, text: string, color: string }> = {
            'welcome': { title: t('guide.section.welcome.title'), text: t('guide.section.welcome.text'), color: 'from-indigo-500 to-purple-600' },
            'generator': { title: t('guide.section.generator.title'), text: t('guide.section.generator.text'), color: 'from-yellow-400 to-orange-500' },
            'pack': { title: t('guide.section.pack.title'), text: t('guide.section.pack.text'), color: 'from-sky-400 to-blue-500' },
            'transposer': { title: t('guide.section.transposer.title'), text: t('guide.section.transposer.text'), color: 'from-purple-500 to-pink-500' },
            'upscaler': { title: t('guide.section.upscale.title'), text: t('guide.section.upscale.text'), color: 'from-emerald-400 to-teal-600' },
            'vector': { title: t('guide.section.vector.title'), text: t('guide.section.vector.text'), color: 'from-teal-400 to-cyan-600' },
        };
        return keyMap[id];
    };

    const content = getActiveContent(activeTab);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
                
                {/* Sidebar (Desktop) */}
                <aside className="w-72 bg-slate-50 border-r border-slate-200 flex-col hidden md:flex">
                    <div className="p-8 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3 mb-1">
                            <GuideIcon size={32} />
                            <h1 className="font-black text-xl text-slate-800 tracking-tighter uppercase">{t('instructions.title')}</h1>
                        </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveTab(section.id)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all text-left uppercase tracking-wide
                                ${activeTab === section.id 
                                    ? 'bg-white shadow-lg text-indigo-600 ring-1 ring-indigo-100 transform translate-x-1' 
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
                            >
                                <span className="flex-shrink-0">{section.icon}</span>
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 bg-white relative">
                    
                    {/* Mobile Header */}
                    <div className="md:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="font-black text-sm uppercase text-slate-500">{t('instructions.title')}</span>
                        <button onClick={onClose} className="p-2 bg-slate-200 rounded-full text-slate-600">✕</button>
                    </div>
                    <div className="md:hidden p-2 border-b border-slate-100 flex overflow-x-auto gap-2 no-scrollbar bg-white shadow-sm z-10">
                         {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveTab(section.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2
                                ${activeTab === section.id 
                                    ? 'bg-slate-800 text-white border-slate-800' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                            >
                                {section.icon} {section.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                        <button 
                            onClick={onClose} 
                            className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition hidden md:block"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
                            {/* Hero Header */}
                            <div className={`rounded-3xl p-8 md:p-12 text-white shadow-2xl bg-gradient-to-br ${content.color}`}>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6">{content.title}</h2>
                                <div className="w-20 h-2 bg-white/30 rounded-full mb-6"></div>
                            </div>

                            {/* Content Body */}
                            <div className="prose prose-lg prose-slate max-w-none">
                                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200 text-slate-600 leading-relaxed shadow-sm">
                                     <div dangerouslySetInnerHTML={{ __html: content.text }} />
                                </div>
                            </div>

                            {/* Welcome Specific Extras */}
                            {activeTab === 'welcome' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                     <div className="p-8 bg-white border-2 border-yellow-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                         <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🍌</div>
                                         <h3 className="text-xl font-black text-slate-800 mb-2">Flash Model</h3>
                                         <p className="text-sm text-slate-500 font-medium">Бесплатная, быстрая модель для простых стикеров. Идеально для тестов.</p>
                                     </div>
                                     <div className="p-8 bg-white border-2 border-indigo-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                         <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💎</div>
                                         <h3 className="text-xl font-black text-slate-800 mb-2">Pro Model</h3>
                                         <p className="text-sm text-slate-500 font-medium">Gemini 3 Pro. Максимальное качество, детализация и точное следование промпту.</p>
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default InstructionsModal;
