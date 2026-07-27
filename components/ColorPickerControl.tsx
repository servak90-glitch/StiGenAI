import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { useTranslation } from '../contexts/LanguageContext';

interface ColorPickerControlProps {
    color: string;
    onChange: (color: string) => void;
}

const ColorPickerControl: React.FC<ColorPickerControlProps> = ({ color, onChange }) => {
    const { t } = useTranslation();
    const [displayColorPicker, setDisplayColorPicker] = useState(false);
    const pickerNode = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (pickerNode.current && !pickerNode.current.contains(e.target as Node)) {
            setDisplayColorPicker(false);
        }
    }, []);

    useEffect(() => {
        if (displayColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [displayColorPicker, handleClickOutside]);

    const handleColorChange = (colorResult: ColorResult) => {
        onChange(colorResult.hex);
    };

    const handleRandomColor = () => {
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        onChange(randomColor);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setDisplayColorPicker(!displayColorPicker)}
                    className="flex-grow flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                    aria-label={t('text.color.custom')}
                >
                    <div
                        className="w-8 h-8 rounded-md border-2 border-white shadow-inner"
                        style={{ backgroundColor: color }}
                    />
                    <div className="text-left">
                        <span className="text-xs text-slate-500">{t('text.color.custom')}</span>
                        <span className="block font-mono text-sm font-semibold text-slate-800">{color.toUpperCase()}</span>
                    </div>
                </button>
                <button
                    onClick={handleRandomColor}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition"
                    title={t('text.color.random')}
                >
                    <span className="text-2xl" role="img" aria-label="dice">🎲</span>
                </button>
            </div>

            {displayColorPicker && (
                <div ref={pickerNode} className="absolute z-20 mt-2 right-0">
                    <SketchPicker 
                        color={color} 
                        onChangeComplete={handleColorChange} 
                        disableAlpha 
                        presetColors={[]}
                    />
                </div>
            )}
        </div>
    );
};

export default ColorPickerControl;