
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Settings, NotificationType, Preset, License, LicenseFeatures } from './types';
import { INITIAL_SETTINGS } from './constants';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import Notification from './components/Notification';
import { useTranslation } from './contexts/LanguageContext';
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import { getUserStyles, deleteUserStyle, UserStyle } from './utils/db';
import { getAllPresets, savePreset, deletePreset } from './utils/presets';
import SunLoader from './components/SunLoader';

// --- LAZY LOADED COMPONENTS ---
// Aggressive code splitting to reduce initial bundle size
const PatchNotesModal = React.lazy(() => import('./components/PatchNotesModal'));
const InstructionsModal = React.lazy(() => import('./components/InstructionsModal'));
const StyleScannerModal = React.lazy(() => import('./components/StyleScannerModal'));
const ImageGenerationModalNew = React.lazy(() => import('./components/ImageGenerationModalNew'));
const WizardModal = React.lazy(() => import('./components/WizardModal'));
const HistoryModal = React.lazy(() => import('./components/HistoryModal'));
const UpscalerModal = React.lazy(() => import('./components/UpscalerModal'));
const ProcessorModal = React.lazy(() => import('./components/ProcessorModal'));

const StickerPackModal = React.lazy(() => import('./components/StickerPackModal'));
const StyleTransposerModal = React.lazy(() => import('./components/StyleTransposerModal'));
const DevBatchForgeModal = React.lazy(() => import('./components/DevBatchForgeModal'));
const AdminLicenseGenerator = React.lazy(() => import('./components/AdminLicenseGenerator'));
const ApiKeyModal = React.lazy(() => import('./components/ApiKeyModal'));

type ActiveModal = 'patchNotes' | 'instructions' | 'scanner' | 'generator' | 'wizard' | 'history' | 'upscaler' | 'processor' | 'mobileMenu' | 'adminLicense' | 'pack' | 'devForge' | 'transposer' | 'apiKey' | null;

const App: React.FC = () => {
    const { t } = useTranslation();
    
    // --- LICENSE STATE (Unrestricted Full Access) ---
    const FULL_UNLOCKED_LICENSE: License = {
        key: 'ADMIN-ACCESS',
        status: 'active',
        features: { 
            allowStickers: true,
            allowPro: true, 
            allowBatch: true, 
            allowVector: true, 
            allowUpscale: true,
            allowScanner: true,
            allowTransposer: true,
            allowPack: true
        },
        limits: { generations: 999999, days: 3650 },
        usage: { usedGenerations: 0 },
        createdAt: Date.now(),
        expiresAt: Date.now() + (3650 * 24 * 60 * 60 * 1000)
    };

    const [license, setLicense] = useState<License>(FULL_UNLOCKED_LICENSE);

    const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
    


    // --- DEV MODE LOGIC ---
    const [isDevMode, setIsDevMode] = useState(true);

    const promptData = usePromptGenerator(settings);

    // --- AUTOMATIC UNLOCKED ACCESS ---
    useEffect(() => {
        setIsDevMode(true);
        localStorage.setItem('isDevMode', 'true');
    }, []); 

    const refreshUserStyles = useCallback(async () => {
        const s = await getUserStyles();
        setUserStyles(s);
    }, []);

    useEffect(() => {
        const load = async () => {
            const loaded = await getAllPresets();
            setPresets(loaded);
            refreshUserStyles();
        };
        load();
    }, [refreshUserStyles]);

    const showNotification = useCallback((message: string, type: NotificationType, duration: number = 3000) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    }, []);

    const closeModal = useCallback(() => setActiveModal(null), []);

    const handleSettingsChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'style' && value === 'LASER_ENGRAVING') {
                next.stickerMode = 'ISOLATION';
            }
            return next;
        });
    }, []);

    const handleSavePreset = async (name: string) => {
        if (!name.trim()) {
            showNotification(t('notification.presets.emptyName'), 'warning');
            return;
        }
        const success = await savePreset({ id: selectedPresetId || Date.now().toString(), name, settings });
        if (success) {
            showNotification(t('notification.presets.saved', { name }), 'success');
            setPresets(await getAllPresets());
            setSelectedPresetId(''); 
        } else {
            showNotification(t('notification.presets.loadFailed'), 'error');
        }
    };

    const handleApplyPreset = (id: string) => {
        const preset = presets.find(p => p.id === id);
        if (preset) {
            setSettings(preset.settings);
            setSelectedPresetId(id);
            showNotification(t('notification.presets.applied', { name: preset.name }), 'success');
        } else {
            setSelectedPresetId('');
        }
    };

    const handleDeletePreset = async (id: string) => {
        await deletePreset(id);
        setPresets(await getAllPresets());
        if (selectedPresetId === id) {
            setSelectedPresetId('');
            setSettings(INITIAL_SETTINGS);
            showNotification(t('notification.settings.reset'), 'info');
        } else {
            showNotification(t('notification.presets.deleted'), 'info');
        }
    };

    const handleDeleteUserStyle = async (id: string) => {
        await deleteUserStyle(id);
        refreshUserStyles();
        showNotification(t('notification.styleDeleted'), 'info');
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(JSON.stringify(promptData, null, 2));
        showNotification(t('preview.copied'), 'success');
    };

    const handleReset = () => {
        setSettings(INITIAL_SETTINGS);
        setSelectedPresetId('');
        showNotification(t('notification.settings.reset'), 'info');
    };

    const handleLogoClick = () => {
        setActiveModal('adminLicense');
        showNotification("🍌 Generator Activated", 'success');
    };

    // Helper for feature checking
    const checkAccess = (feature: keyof LicenseFeatures, modal: ActiveModal) => {
        if (license?.features[feature]) {
            setActiveModal(modal);
        } else {
            showNotification(t('notification.availablePremium'), 'warning');
        }
    };

    return (
        <div className="fixed inset-0 w-full h-[100dvh] flex flex-col text-[#5A5A5A] font-sans overflow-hidden">
            {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}

            {/* Suspense Wrapper for Lazy Loaded Modals */}
            <Suspense fallback={
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/25 backdrop-blur-sm">
                    <SunLoader className="w-16 h-16" />
                </div>
            }>
                {activeModal === 'patchNotes' && <PatchNotesModal isOpen={true} onClose={closeModal} />}
                {activeModal === 'instructions' && <InstructionsModal isOpen={true} onClose={closeModal} />}
                {activeModal === 'scanner' && <StyleScannerModal isOpen={true} onClose={closeModal} />}
                
                {activeModal === 'generator' && (
                    <ImageGenerationModalNew 
                        isOpen={true} 
                        onClose={closeModal} 
                        promptData={promptData} 
                        onSettingsChange={handleSettingsChange}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))} 
                        userStyles={userStyles}
                        onDeleteUserStyle={handleDeleteUserStyle}
                    />
                )}

                {activeModal === 'pack' && (
                    <StickerPackModal
                        isOpen={true}
                        onClose={closeModal}
                        settings={settings}
                        onSettingsChange={handleSettingsChange}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))}
                        userStyles={userStyles}
                        onDeleteUserStyle={handleDeleteUserStyle}
                    />
                )}

                {activeModal === 'wizard' && <WizardModal isOpen={true} onClose={closeModal} onComplete={(s) => { setSettings(s); setActiveModal('generator'); }} />}
                {activeModal === 'history' && <HistoryModal isOpen={true} onClose={closeModal} onRestoreSettings={(s) => { setSettings(s); setActiveModal('generator'); }} />}
                
                {activeModal === 'upscaler' && (
                    <UpscalerModal 
                        isOpen={true} 
                        onClose={closeModal} 
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))}
                    />
                )}
                
                {activeModal === 'processor' && (
                    <ProcessorModal 
                        isOpen={true} 
                        onClose={closeModal} 
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))}
                    />
                )}

                {activeModal === 'transposer' && (
                    <StyleTransposerModal
                        isOpen={true}
                        onClose={closeModal}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))}
                        onStyleSaved={refreshUserStyles}
                        isDevMode={isDevMode}
                    />
                )}

                {isDevMode && activeModal === 'devForge' && (
                    <DevBatchForgeModal
                        isOpen={true}
                        onClose={closeModal}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => ({ ...prev, usage: { ...prev.usage, usedGenerations: newUsage }}))}
                    />
                )}
                
                {isDevMode && activeModal === 'adminLicense' && (
                    <AdminLicenseGenerator isOpen={true} onClose={closeModal} />
                )}

                {activeModal === 'apiKey' && (
                    <ApiKeyModal isOpen={true} onClose={closeModal} />
                )}
            </Suspense>
            
            <Header 
                activeModal={activeModal}
                onOpenGenerator={() => checkAccess('allowStickers', 'generator')}
                onOpenTransposer={() => checkAccess('allowTransposer', 'transposer')}
                onOpenUpscaler={() => checkAccess('allowUpscale', 'upscaler')}
                onOpenPack={() => checkAccess('allowPack', 'pack')}
                onOpenProcessor={() => checkAccess('allowVector', 'processor')}
                onOpenSettingsMenu={() => setActiveModal('mobileMenu')}
                onLogoClick={handleLogoClick}
                license={license}
            />

            <MobileMenu 
                isOpen={activeModal === 'mobileMenu'} 
                onClose={closeModal}
                onOpenPatchNotes={() => setActiveModal('patchNotes')}
                onOpenInstructions={() => setActiveModal('instructions')}
                onOpenWizard={() => checkAccess('allowStickers', 'wizard')}
                onOpenHistory={() => checkAccess('allowPro', 'history')}
                onOpenUpscaler={() => checkAccess('allowUpscale', 'upscaler')}
                onOpenProcessor={() => checkAccess('allowVector', 'processor')}
                onOpenDevForge={() => setActiveModal('devForge')}
                onOpenLicenseGenerator={() => setActiveModal('adminLicense')}
                onOpenApiKey={() => setActiveModal('apiKey')}
                onCopy={handleCopyPrompt}
                onReset={handleReset}
                presets={presets}
                onSaveOrUpdatePreset={handleSavePreset}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
                selectedPresetId={selectedPresetId}
                isDevMode={isDevMode} 
                license={license}
            />

            <main className="flex-1 flex flex-col items-center p-4 md:p-8 relative overflow-y-auto pb-24">
                {/* AMBIENT BACKGROUND GLOWS */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-300/20 via-purple-300/20 to-pink-300/20 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />
                <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-200/15 blur-3xl rounded-full pointer-events-none -z-10" />
                <div className="absolute top-1/3 right-10 w-72 h-72 bg-sky-200/15 blur-3xl rounded-full pointer-events-none -z-10" />

                <div className="max-w-4xl w-full text-center space-y-6 md:space-y-8 animate-fade-in my-auto py-6 sm:py-8 relative z-0">
                    
                    {/* APP TITLE WITH GRADIENT */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span>v6.5 • Next-Gen Graphics Engine</span>
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight select-none">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-indigo-600 to-pink-500 hover:opacity-95 transition-opacity">
                                StiGenAi
                            </span>
                        </h1>
                    </div>

                    {/* LANGUAGE SWITCH HELPER NOTE */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200/90 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs backdrop-blur-sm">
                            <span>{t('lang.hint')}</span>
                        </div>
                    </div>

                    {/* ABOUT & CAPABILITIES OVERVIEW */}
                    <div className="space-y-4 max-w-2xl mx-auto pt-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            {t('home.about.title')}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                            {t('home.about.desc')}
                        </p>
                    </div>

                    {/* CAPABILITIES CARDS GRID (INVERTED PYRAMID) */}
                    <div className="pt-4 space-y-3 sm:space-y-4 w-full text-left">
                        {/* TOP ROW: 3 CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4.5 w-full">
                            {license.features.allowStickers && (
                                <div 
                                    onClick={() => checkAccess('allowStickers', 'generator')} 
                                    className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 border border-indigo-200/80 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-98"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                ✨
                                            </span>
                                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {t('home.feature.generator.title')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-700 tracking-wider hidden sm:inline-block">
                                                AI 3.0
                                            </span>
                                            <span className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all text-lg font-bold">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {t('home.feature.generator.desc')}
                                    </p>
                                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full" />
                                </div>
                            )}

                            {license.features.allowTransposer && (
                                <div 
                                    onClick={() => checkAccess('allowTransposer', 'transposer')} 
                                    className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-fuchsia-50/90 via-white to-pink-50/50 border border-fuchsia-200/80 hover:border-fuchsia-400 hover:shadow-xl hover:shadow-fuchsia-500/10 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-98"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2.5 bg-gradient-to-tr from-fuchsia-500 to-pink-600 text-white rounded-xl shadow-md shadow-fuchsia-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                🧬
                                            </span>
                                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-fuchsia-600 transition-colors">
                                                {t('home.feature.transposer.title')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-fuchsia-100/80 text-fuchsia-700 tracking-wider hidden sm:inline-block">
                                                Style Match
                                            </span>
                                            <span className="text-slate-300 group-hover:text-fuchsia-500 group-hover:translate-x-1 transition-all text-lg font-bold">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {t('home.feature.transposer.desc')}
                                    </p>
                                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-500 rounded-full" />
                                </div>
                            )}

                            {license.features.allowUpscale && (
                                <div 
                                    onClick={() => checkAccess('allowUpscale', 'upscaler')} 
                                    className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-98"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-xl shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                🚀
                                            </span>
                                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                {t('home.feature.upscaler.title')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-700 tracking-wider hidden sm:inline-block">
                                                4K Ultra
                                            </span>
                                            <span className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all text-lg font-bold">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {t('home.feature.upscaler.desc')}
                                    </p>
                                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* BOTTOM ROW: 2 CARDS CENTERED */}
                        <div className="flex flex-col md:flex-row justify-center gap-3.5 sm:gap-4.5 max-w-2xl mx-auto w-full">
                            {license.features.allowPack && (
                                <div 
                                    onClick={() => checkAccess('allowPack', 'pack')} 
                                    className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 border border-amber-200/80 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-98 flex-1"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-xl shadow-md shadow-amber-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                📦
                                            </span>
                                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                                                {t('home.feature.pack.title')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 tracking-wider hidden sm:inline-block">
                                                Batch
                                            </span>
                                            <span className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all text-lg font-bold">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {t('home.feature.pack.desc')}
                                    </p>
                                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full" />
                                </div>
                            )}

                            {license.features.allowVector && (
                                <div 
                                    onClick={() => checkAccess('allowVector', 'processor')} 
                                    className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/50 border border-sky-200/80 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 transform hover:-translate-y-1 active:scale-98 flex-1"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-2.5 bg-gradient-to-tr from-sky-500 to-blue-600 text-white rounded-xl shadow-md shadow-sky-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                ✂️
                                            </span>
                                            <h3 className="font-extrabold text-base text-slate-900 group-hover:text-sky-600 transition-colors">
                                                {t('home.feature.vector.title')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-100/80 text-sky-800 tracking-wider hidden sm:inline-block">
                                                Vector SVG
                                            </span>
                                            <span className="text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all text-lg font-bold">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {t('home.feature.vector.desc')}
                                    </p>
                                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500 rounded-full" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default App;
