import React from 'react';

interface SunLoaderProps {
    className?: string;
}

const SunLoader: React.FC<SunLoaderProps> = ({ className = "" }) => {
    const uniqueId = React.useId();
    const maskId = `sun-mask-${uniqueId.replace(/:/g, '')}`;

    return (
        <div className={`sun-loader ${className}`}>
            <svg width="100" height="100" viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-0">
                <defs>
                    <mask id={maskId}>
                        <rect x="0" y="0" width="100" height="100" fill="black" />
                        <circle cx="50" cy="50" r="20" fill="white" />
                        <g fill="white">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                                <rect 
                                    key={deg}
                                    x="47" y="10" width="6" height="15" 
                                    rx="3"
                                    transform={`rotate(${deg} 50 50)`} 
                                />
                            ))}
                        </g>
                    </mask>
                </defs>
            </svg>
            <div 
                className="box" 
                style={{ 
                    mask: `url(#${maskId})`, 
                    WebkitMask: `url(#${maskId})` 
                }}
            />
        </div>
    );
};

export default SunLoader;