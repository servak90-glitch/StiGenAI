
import React, { useState, useEffect } from 'react';
import { Preset } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface PresetManagerProps {
    presets: Preset[];
    onSaveOrUpdate: (name: string) => void;
    onApply: (id: string) => void;
    onDelete: (id: string) => void;
    selectedPresetId: string;
}

const PresetManager: React.FC<PresetManagerProps> = ({ presets, onSaveOrUpdate, onApply, onDelete, selectedPresetId }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const selectedPreset = presets.find(p => p.id === selectedPresetId);
        setInputValue(selectedPreset ? selectedPreset.name : '');
    }, [selectedPresetId, presets]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        const matchedPreset = presets.find(p => p.name === value);
        if (matchedPreset && matchedPreset.id !== selectedPresetId) {
            onApply(matchedPreset.id);
        } else if (!matchedPreset && selectedPresetId) {
            onApply('');
        }
    };

    const handleSave = () => {
        onSaveOrUpdate(inputValue);
    };
    
    const handleDelete = () => {
        if (selectedPresetId) {
            setConfirmDeleteId(selectedPresetId)
        }
    };
    
    const handleDeleteConfirm = () => {
        if (confirmDeleteId) {
            onDelete(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };
    
    const selectedPreset = presets.find(p => p.id === selectedPresetId);
    const isExistingAndSelected = selectedPreset && selectedPreset.name === inputValue;

    const saveButtonText = isExistingAndSelected ? t('presets.update') : t('presets.save');
    const isDeleteDisabled = !isExistingAndSelected;

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="relative flex-grow group">
                 <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <input
                    type="text"
                    list="presets-datalist"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder={t('presets.placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200/60 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white transition-all shadow-sm"
                />
                <datalist id="presets-datalist">
                    {presets.map(p => (
                        <option key={p.id} value={p.name} />
                    ))}
                </datalist>
            </div>
            <button
                onClick={handleSave}
                className="px-4 py-2.5 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all shadow-md hover:-translate-y-0.5 active:scale-95 flex-shrink-0"
            >
                {saveButtonText}
            </button>
             <button
                onClick={handleDelete}
                disabled={isDeleteDisabled}
                title={isDeleteDisabled ? undefined : t('presets.delete')}
                className={`p-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 border 
                ${isDeleteDisabled 
                    ? 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed' 
                    : 'bg-white text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 hover:shadow-md active:scale-95'}`}
            >
                 <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            {confirmDeleteId && (
                 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setConfirmDeleteId(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-white/50" onClick={e => e.stopPropagation()}>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{t('presets.delete')}</h4>
                        <p className="text-slate-600 mb-6">{t('presets.confirmDelete')}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
                                {t('presets.modal.cancel')}
                            </button>
                            <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition">
                                {t('presets.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresetManager;
