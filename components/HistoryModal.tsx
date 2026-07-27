
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/db';
import { Settings } from '../types';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestoreSettings: (settings: Settings) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onRestoreSettings }) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        setLoading(true);
        const history = await getHistory();
        // Sort by date desc
        setItems(history.reverse());
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteFromHistory(id);
        loadHistory();
    };

    const handleClear = async () => {
        if (confirm(t('history.clearConfirm'))) {
            await clearHistory();
            loadHistory();
        }
    };

    const handleDownload = (base64: string, id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = base64;
        link.download = `sticker-history-${id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            🕰️ {t('history.title')}
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">{t('history.subtitle')}</p>
                    </div>
                    <div className="flex gap-2">
                        {items.length > 0 && (
                            <button onClick={handleClear} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                                {t('history.clear')}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-grow overflow-y-auto p-6 bg-slate-100/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-slate-400">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                            <span className="text-6xl mb-4">📭</span>
                            <p>{t('history.empty')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="group relative aspect-square bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                                     onClick={() => {
                                         onRestoreSettings(item.settings);
                                         onClose();
                                     }}
                                     title={t('history.restoreTooltip')}
                                >
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                         <button 
                                            onClick={(e) => handleDownload(item.imageData, item.id, e)}
                                            className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:text-sky-600 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:text-red-600 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <img src={item.imageData} className="w-full h-full object-contain p-2" alt="History item" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-6 text-white text-[10px] truncate">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
