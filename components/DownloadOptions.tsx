
import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import OptionSelector from './OptionSelector';
import { TracerPresetKey } from '../utils/svgTracer';

interface DownloadOptionsProps {
    doUpscale: boolean;
    setDoUpscale: (val: boolean) => void;
    removeBackground: boolean;
    setRemoveBackground: (val: boolean) => void;
    addCutLine: boolean;
    setAddCutLine: (val: boolean) => void;
    exportFormat: 'PNG' | 'JPG' | 'SVG';
    setExportFormat: (val: 'PNG' | 'JPG' | 'SVG') => void;
    vectorMode: TracerPresetKey;
    setVectorMode: (val: TracerPresetKey) => void;
    t: (key: string) => string;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({ 
    doUpscale, setDoUpscale, 
    removeBackground, setRemoveBackground, 
    addCutLine, setAddCutLine, 
    exportFormat, setExportFormat, 
    vectorMode, setVectorMode, 
    t 
}) => (
    <div className="glass-card p-4 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('generator.downloadOptions.title')}
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
            <ToggleSwitch 
                id="upscale" 
                label={t('label.upscale')} 
                checked={doUpscale} 
                onChange={setDoUpscale} 
            />
            <ToggleSwitch 
                id="removeBg" 
                label={t('label.transparentBg')} 
                checked={removeBackground} 
                onChange={setRemoveBackground} 
            />
            <ToggleSwitch 
                id="cutLine" 
                label={t('label.cutLine')} 
                checked={addCutLine} 
                onChange={setAddCutLine} 
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">{t('label.format')}</label>
            <OptionSelector
                name="exportFormat"
                value={exportFormat}
                onChange={(val) => setExportFormat(val)}
                options={[
                    { value: 'PNG', label: 'PNG' },
                    { value: 'JPG', label: 'JPG' },
                    { value: 'SVG', label: 'SVG' },
                ]}
                gridCols="grid-cols-3"
            />
        </div>

        {exportFormat === 'SVG' && (
            <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-500 mb-2">{t('label.vectorDetail')}</label>
                <OptionSelector
                    name="vectorMode"
                    value={vectorMode}
                    onChange={(val) => setVectorMode(val)}
                    options={[
                        { value: 'BALANCED', label: t('option.standard') },
                        { value: 'HIGH_DETAIL', label: t('option.high') },
                        { value: 'SMOOTHED', label: t('option.smooth') },
                    ]}
                    gridCols="grid-cols-3"
                />
            </div>
        )}
    </div>
);

export default DownloadOptions;
