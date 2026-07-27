import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { APP_VERSION } from '../constants';

interface PatchNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface VersionHistory {
    version: string;
    changes: string[];
}

const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!isOpen) {
        return null;
    }

    let versions: VersionHistory[] = [];
    try {
        versions = JSON.parse(t('patchNotes.versions'));
    } catch (error) {
        console.error("Failed to parse version history from i18n:", error);
        // Gracefully fail, versions will be an empty array
    }

    return (
        <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="patch-notes-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-5 border-b border-slate-200 flex-shrink-0">
                    <h2 id="patch-notes-title" className="text-xl font-bold text-slate-800">
                        {t('patchNotes.title')} <span className="text-sm font-normal text-slate-500">v{APP_VERSION}</span>
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                        aria-label={t('patchNotes.close')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg" role="alert">
                        <h3 className="font-bold text-yellow-900 mb-1">{t('patchNotes.warning.title')}</h3>
                        <p className="text-sm text-yellow-800">{t('patchNotes.warning.content')}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-700 mb-3">{t('patchNotes.contact.title')}</h3>
                        <p 
                            className="text-sm text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: t('patchNotes.contact.content') }} 
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-700 mb-3">{t('patchNotes.history.title')}</h3>
                        <div className="space-y-5">
                            {versions.length > 0 ? (
                                versions.map((versionData, index) => (
                                    <div key={index}>
                                        <h4 className="font-bold text-sky-600">{`v${versionData.version}`}</h4>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-slate-600">
                                            {versionData.changes.map((change, i) => (
                                                <li key={i}>{change}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">Could not load version history.</p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PatchNotesModal;
