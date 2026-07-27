
import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Settings, NotificationType, Preset, License, CardSettings, LicenseFeatures } from './types';
import { INITIAL_SETTINGS, INITIAL_CARD_SETTINGS } from './constants';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import Notification from './components/Notification';
import { useTranslation } from './contexts/LanguageContext';
import Header from './components/Header';
import MobileMenu from './components/MobileMenu';
import LockScreen from './components/LockScreen';
import { getHistory, getUserStyles, deleteUserStyle, UserStyle } from './utils/db';
import { getAllPresets, savePreset, deletePreset } from './utils/presets';
import SunLoader from './components/SunLoader';

// --- LAZY LOADED COMPONENTS ---
// Aggressive code splitting to reduce initial bundle size
const PatchNotesModal = React.lazy(() => import('./components/PatchNotesModal'));
const InstructionsModal = React.lazy(() => import('./components/InstructionsModal'));
const StyleScannerModal = React.lazy(() => import('./components/StyleScannerModal'));
const ImageGenerationModalNew = React.lazy(() => import('./components/ImageGenerationModalNew'));
const CardGenerationModal = React.lazy(() => import('./components/CardGenerationModal'));
const WizardModal = React.lazy(() => import('./components/WizardModal'));
const HistoryModal = React.lazy(() => import('./components/HistoryModal'));
const UpscalerModal = React.lazy(() => import('./components/UpscalerModal'));
const ProcessorModal = React.lazy(() => import('./components/ProcessorModal'));
const PrintMasterModal = React.lazy(() => import('./components/PrintMasterModal'));
const BrandBundleModal = React.lazy(() => import('./components/BrandBundleModal'));
const StickerPackModal = React.lazy(() => import('./components/StickerPackModal'));
const StyleTransposerModal = React.lazy(() => import('./components/StyleTransposerModal'));
const DevBatchForgeModal = React.lazy(() => import('./components/DevBatchForgeModal'));
const AdminLicenseGenerator = React.lazy(() => import('./components/AdminLicenseGenerator'));
const ApiKeyModal = React.lazy(() => import('./components/ApiKeyModal'));

type ActiveModal = 'patchNotes' | 'instructions' | 'scanner' | 'generator' | 'wizard' | 'history' | 'upscaler' | 'processor' | 'mobileMenu' | 'adminLicense' | 'cards' | 'print' | 'harmony' | 'pack' | 'devForge' | 'transposer' | 'apiKey' | null;

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

    const [license, setLicense] = useState<License | null>(FULL_UNLOCKED_LICENSE);
    const [isLicenseLoading, setIsLicenseLoading] = useState(false);

    const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
    const [cardSettings, setCardSettings] = useState<CardSettings>(INITIAL_CARD_SETTINGS);
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [recentHistory, setRecentHistory] = useState<any[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [userStyles, setUserStyles] = useState<UserStyle[]>([]);
    
    // Print Hub State
    const [printImages, setPrintImages] = useState<string[]>([]);

    // --- DEV MODE LOGIC ---
    const [isDevMode, setIsDevMode] = useState(true);
    const logoClickCount = useRef(0);
    const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const promptData = usePromptGenerator(settings);

    // --- AUTOMATIC UNLOCKED ACCESS ON MOUNT ---
    useEffect(() => {
        setLicense(FULL_UNLOCKED_LICENSE);
        setIsDevMode(true);
        setIsLicenseLoading(false);
    }, []);

    useEffect(() => {
        if (license?.key === 'ADMIN-ACCESS') {
            setIsDevMode(true);
            localStorage.setItem('isDevMode', 'true');
        }
    }, [license]);

    useEffect(() => {
        const loadRecent = async () => {
            const h = await getHistory();
            setRecentHistory(h.slice(-4).reverse());
        };
        loadRecent();
    }, [activeModal]); 

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
        setSettings(prev => ({ ...prev, [key]: value }));
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

    const handleLogout = useCallback(() => {
        localStorage.removeItem('licenseKey');
        localStorage.removeItem('isDevMode');
        // Do not clear demoUsage here to prevent easy reset by re-login
        setLicense(null);
        setIsDevMode(false);
        showNotification(t('notification.logout.success'), 'info');
    }, [t, showNotification]);

    const handleLogoClick = () => {
        logoClickCount.current += 1;
        if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
        logoClickTimer.current = setTimeout(() => {
            logoClickCount.current = 0;
        }, 500); 

        if (logoClickCount.current >= 5) {
            logoClickCount.current = 0;
            if (isDevMode) {
                setActiveModal('adminLicense');
                showNotification("🍌 Generator Activated", 'success');
            } else {
                 showNotification(t('notification.adminAccess'), 'info');
            }
        }
    };

    const openPrintHubWithImages = (images: string[]) => {
        setPrintImages(images);
        setActiveModal('print');
    };

    // Helper for feature checking
    const checkAccess = (feature: keyof LicenseFeatures, modal: ActiveModal) => {
        if (license?.features[feature]) {
            setActiveModal(modal);
        } else {
            showNotification(t('notification.availablePremium'), 'warning');
        }
    };

    if (isLicenseLoading) {
        return <div className="h-screen w-full flex items-center justify-center bg-[#F5F3F0] text-slate-400">Loading...</div>;
    }

    if (!license) {
        return <LockScreen onSuccess={setLicense} />;
    }

    return (
        <div className="fixed inset-0 w-full h-[100dvh] flex flex-col text-[#5A5A5A] font-sans overflow-hidden">
            {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
            
            <div className={`text-[10px] text-center py-1 font-medium tracking-wide flex-shrink-0 z-50 ${isDevMode ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white'}`}>
                 {isDevMode ? t('dashboard.adminMode') : t('dashboard.licenseActive', { used: license.usage.usedGenerations.toString(), total: license.limits.generations.toString() })}
            </div>

            {/* Suspense Wrapper for Lazy Loaded Modals */}
            <Suspense fallback={
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
                    <SunLoader />
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
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)} 
                        onOpenPrint={openPrintHubWithImages}
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
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                        onOpenPrint={openPrintHubWithImages}
                        userStyles={userStyles}
                        onDeleteUserStyle={handleDeleteUserStyle}
                    />
                )}

                {activeModal === 'cards' && (
                    <CardGenerationModal 
                        isOpen={true}
                        onClose={closeModal}
                        settings={cardSettings}
                        onSettingsChange={setCardSettings}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                    />
                )}
                
                {activeModal === 'wizard' && <WizardModal isOpen={true} onClose={closeModal} onComplete={(s) => { setSettings(s); setActiveModal('generator'); }} />}
                {activeModal === 'history' && <HistoryModal isOpen={true} onClose={closeModal} onRestoreSettings={(s) => { setSettings(s); setActiveModal('generator'); }} />}
                
                {activeModal === 'upscaler' && (
                    <UpscalerModal 
                        isOpen={true} 
                        onClose={closeModal} 
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                    />
                )}
                
                {activeModal === 'processor' && (
                    <ProcessorModal 
                        isOpen={true} 
                        onClose={closeModal} 
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                    />
                )}

                {activeModal === 'print' && (
                    <PrintMasterModal 
                        isOpen={true}
                        onClose={closeModal}
                        initialImages={printImages} 
                    />
                )}

                {activeModal === 'harmony' && (
                    <BrandBundleModal 
                        isOpen={true}
                        onClose={closeModal}
                        brandData={cardSettings.cardData}
                        style={cardSettings.style}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                    />
                )}

                {activeModal === 'transposer' && (
                    <StyleTransposerModal
                        isOpen={true}
                        onClose={closeModal}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                        onOpenPrint={openPrintHubWithImages}
                        onStyleSaved={refreshUserStyles}
                        isDevMode={isDevMode}
                    />
                )}

                {isDevMode && activeModal === 'devForge' && (
                    <DevBatchForgeModal
                        isOpen={true}
                        onClose={closeModal}
                        license={license}
                        onUsageUpdate={(newUsage) => setLicense(prev => prev ? {...prev, usage: { ...prev.usage, usedGenerations: newUsage }} : null)}
                        onOpenPrint={openPrintHubWithImages}
                    />
                )}
                
                {isDevMode && activeModal === 'adminLicense' && (
                    <AdminLicenseGenerator isOpen={true} onClose={closeModal} />
                )}

                {activeModal === 'apiKey' && (
                    <ApiKeyModal isOpen={true} onClose={closeModal} />
                )}
            </Suspense>
            
            <MobileMenu 
                isOpen={activeModal === 'mobileMenu'} 
                onClose={closeModal}
                onOpenPatchNotes={() => setActiveModal('patchNotes')}
                onOpenInstructions={() => setActiveModal('instructions')}
                onOpenScanner={() => checkAccess('allowScanner', 'scanner')}
                onOpenUpscaler={() => checkAccess('allowUpscale', 'upscaler')}
                onOpenProcessor={() => checkAccess('allowVector', 'processor')}
                onOpenLicenseGenerator={() => setActiveModal('adminLicense')}
                onOpenDevForge={() => setActiveModal('devForge')}
                onOpenApiKey={() => setActiveModal('apiKey')}
                onReset={handleReset}
                onLogout={handleLogout}
                presets={presets}
                onSaveOrUpdatePreset={handleSavePreset}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
                selectedPresetId={selectedPresetId}
                isDevMode={isDevMode} 
                license={license}
            />
            
            <Header 
                onOpenPatchNotes={() => setActiveModal('patchNotes')}
                onOpenInstructions={() => setActiveModal('instructions')}
                onOpenWizard={() => checkAccess('allowStickers', 'wizard')}
                onOpenMobileMenu={() => setActiveModal('mobileMenu')}
                onCopy={handleCopyPrompt}
                onOpenHistory={() => checkAccess('allowPro', 'history')}
                onOpenUpscaler={() => checkAccess('allowUpscale', 'upscaler')}
                onOpenProcessor={() => checkAccess('allowVector', 'processor')}
                onOpenDevForge={() => setActiveModal('devForge')}
                onOpenLicenseGenerator={() => setActiveModal('adminLicense')}
                onOpenApiKey={() => setActiveModal('apiKey')}
                onLogout={handleLogout}
                onLogoClick={handleLogoClick}
                isDevMode={isDevMode}
                license={license}
            />

            <main className="flex-1 flex flex-col items-center p-4 md:p-6 relative overflow-y-auto pb-40">

                <div className="max-w-4xl w-full text-center space-y-6 md:space-y-8 animate-fade-in z-0 my-auto pb-4 sm:pb-0">
                    <h2 className="text-4xl sm:text-6xl font-black text-[#5A5A5A] tracking-tight leading-tight">
                        {t('hero.title.create')} <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8D5D8] to-[#D4C5E8]">{t('hero.title.stickers')}</span>
                    </h2>
                    
                    <p className="text-lg text-[#8B8B8B] max-w-2xl mx-auto hidden sm:block">
                        {t('header.subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                         {license.features.allowStickers && (
                            <button 
                                onClick={() => setActiveModal('generator')}
                                className="group relative px-8 py-5 bg-[#5A5A5A] text-[#F5F3F0] rounded-2xl font-bold text-xl shadow-xl hover:bg-[#4A4A4A] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 overflow-hidden"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span>✨ {t('dashboard.start')}</span>
                            </button>
                        )}
                        
                        {license.features.allowTransposer && (
                            <button 
                                onClick={() => setActiveModal('transposer')}
                                className="px-8 py-5 bg-gradient-to-br from-[#A8D5D8] to-sky-400 text-white rounded-2xl font-bold text-xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <span className="text-2xl">🧬</span>
                                <span>{t('dashboard.transposer')}</span>
                            </button>
                        )}
                    </div>

                    <div className="pt-8 md:pt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-5xl mx-auto">
                        {license.features.allowStickers && (
                            <div onClick={() => setActiveModal('wizard')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-sky-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🧙‍♂️</span>
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs md:text-sm">{t('dashboard.wizard')}</span>
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{t('dashboard.wizard.desc')}</span>
                                </div>
                            </div>
                        )}
                        {license.features.allowPack && (
                            <div onClick={() => setActiveModal('pack')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-sky-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">📦</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.pack')}</span>
                            </div>
                        )}
                        {license.features.allowUpscale && (
                            <div onClick={() => setActiveModal('upscaler')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-emerald-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🚀</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.upscaler')}</span>
                            </div>
                        )}
                        {license.features.allowVector && (
                            <div onClick={() => setActiveModal('processor')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-cyan-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">✂️</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.vectorize')}</span>
                            </div>
                        )}
                        {license.features.allowCards && (
                            <div onClick={() => setActiveModal('cards')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-blue-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">📇</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.cards')}</span>
                            </div>
                        )}
                        {license.features.allowHarmony && (
                            <div onClick={() => setActiveModal('harmony')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-purple-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🎨</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.harmony')}</span>
                            </div>
                        )}
                        {license.features.allowPrint && (
                            <div onClick={() => openPrintHubWithImages([])} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-slate-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🖨️</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.print')}</span>
                            </div>
                        )}
                        {license.features.allowPro && (
                            <div onClick={() => setActiveModal('history')} className="clean-card p-4 md:p-6 cursor-pointer flex flex-col items-center gap-2 md:gap-3 group hover:border-amber-300">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🕰️</span>
                                <span className="font-bold text-xs md:text-sm">{t('dashboard.history')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {recentHistory.length > 0 && license.features.allowPro && (
                     <div className="w-full flex justify-center gap-4 px-6 overflow-x-auto no-scrollbar pointer-events-none mt-8 pb-4 md:absolute md:bottom-6 md:left-0 md:right-0 md:mt-0 md:pb-0 z-10">
                        {recentHistory.map((item) => (
                            <div key={item.id} className="w-16 h-16 rounded-xl bg-white border border-[#E8E3DC] shadow-sm p-1 pointer-events-auto hover:scale-110 transition-transform cursor-pointer flex-shrink-0" onClick={() => { setSettings(item.settings); setActiveModal('generator'); }}>
                                <img src={item.imageData} className="w-full h-full object-contain" alt="Recent" />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
