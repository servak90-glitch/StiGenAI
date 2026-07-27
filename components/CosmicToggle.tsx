import React from 'react';

interface CosmicToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  scale?: number;
  className?: string;
}

const CosmicToggle: React.FC<CosmicToggleProps> = ({ label, checked, onChange, disabled, scale = 0.35, className = "" }) => {
  return (
    <label className={`flex items-center justify-between p-2 rounded-xl bg-[#FAFAF8] border border-[#E8E3DC] cursor-pointer hover:border-[#A8D5D8] transition-all group ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}>
      {label && <span className="text-xs font-bold text-[#5A5A5A] group-hover:text-[#4A4A4A] transition-colors uppercase tracking-wide mr-2">{label}</span>}
      <div style={{ width: 140 * scale, height: 70 * scale, position: 'relative' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
            <div className="cosmic-toggle">
                <input 
                    className="cosmic-input" 
                    type="checkbox" 
                    checked={checked} 
                    onChange={(e) => !disabled && onChange(e.target.checked)} 
                    disabled={disabled}
                />
                <div className="cosmic-slider">
                    <div className="cosmic-bg"></div>
                    <div className="cosmic-line"></div>
                    <div className="cosmic-line"></div>
                    <div className="cosmic-line"></div>
                    <div className="cosmic-orb">
                    <div className="cosmic-inner"></div>
                    <div className="cosmic-ring"></div>
                    </div>
                    <div className="cosmic-particles">
                    <div style={{ "--angle": "30deg" } as any} className="cosmic-p"></div>
                    <div style={{ "--angle": "60deg" } as any} className="cosmic-p"></div>
                    <div style={{ "--angle": "90deg" } as any} className="cosmic-p"></div>
                    <div style={{ "--angle": "120deg" } as any} className="cosmic-p"></div>
                    <div style={{ "--angle": "150deg" } as any} className="cosmic-p"></div>
                    <div style={{ "--angle": "180deg" } as any} className="cosmic-p"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </label>
  );
};

export default CosmicToggle;