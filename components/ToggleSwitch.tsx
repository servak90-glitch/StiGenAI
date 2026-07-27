import React from 'react';
import CosmicToggle from './CosmicToggle';

interface ToggleSwitchProps {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    disabledReason?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, disabled = false, disabledReason = '' }) => {
    return (
        <div title={disabledReason}>
             <CosmicToggle 
                label={label}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                scale={0.35}
             />
        </div>
    );
};

export default ToggleSwitch;