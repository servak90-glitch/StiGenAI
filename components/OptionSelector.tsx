
import React from 'react';

interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}

interface OptionSelectorProps {
    name: string;
    options: Option[];
    value: string;
    onChange: (value: any) => void;
    gridCols?: string;
    disabled?: boolean;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ name, options, value, onChange, gridCols = 'grid-cols-2 md:grid-cols-3', disabled = false }) => {
    return (
        <div className={`grid ${gridCols} gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <label
                        key={option.value}
                        className={`relative flex items-center justify-center text-center px-2 py-3 text-xs cursor-pointer rounded-xl transition-all duration-200 select-none overflow-hidden
                        ${isSelected 
                            ? 'bg-white text-indigo-600 shadow-sm ring-2 ring-indigo-500 font-black' 
                            : option.disabled 
                                ? 'opacity-50 cursor-not-allowed text-slate-400' 
                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 font-bold'}`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={isSelected}
                            onChange={(e) => onChange(e.target.value)}
                            className="sr-only"
                            disabled={disabled || option.disabled}
                        />
                        <span className="relative z-10 truncate">
                            {option.label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
};

export default OptionSelector;
