import React from 'react';

interface MultiCircleLoaderProps {
    className?: string;
}

const MultiCircleLoader: React.FC<MultiCircleLoaderProps> = ({ className = "" }) => {
    return (
        <div className={`multi-circle-loader ${className}`}>
            <div className="mc-circle" />
            <div className="mc-circle" />
            <div className="mc-circle" />
            <div className="mc-circle" />
            <div className="mc-circle" />
        </div>
    );
};

export default MultiCircleLoader;