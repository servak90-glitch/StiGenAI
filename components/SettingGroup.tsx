
import React from 'react';

interface SettingGroupProps {
    title: string;
    children: React.ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
    return (
        <div className="glass-card p-5 mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200/30 pb-2 uppercase tracking-wide opacity-80">
                {title}
            </h3>
            {children}
        </div>
    );
};

export default SettingGroup;
