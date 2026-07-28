import React from 'react';

interface SunLoaderProps {
    className?: string;
}

const SunLoader: React.FC<SunLoaderProps> = ({ className = "w-12 h-12" }) => {
    const id = React.useId().replace(/:/g, '');

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full animate-spin"
                style={{ animationDuration: '1.2s' }}
            >
                <defs>
                    <linearGradient id={`loader-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="35%" stopColor="#8b5cf6" />
                        <stop offset="70%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <filter id={`loader-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                
                {/* Background Ring Track */}
                <circle 
                    cx="50" 
                    cy="50" 
                    r="36" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="7" 
                    className="text-slate-200/50"
                />

                {/* Animated Gradient Arc */}
                <circle 
                    cx="50" 
                    cy="50" 
                    r="36" 
                    fill="none" 
                    stroke={`url(#loader-grad-${id})`} 
                    strokeWidth="7" 
                    strokeLinecap="round"
                    strokeDasharray="160 70"
                    filter={`url(#loader-glow-${id})`}
                />
            </svg>

            {/* Inner Glowing AI Magic Spark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-[25%]">
                <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="w-full h-full text-amber-500 animate-pulse"
                >
                    <path 
                        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" 
                        fill="url(#spark-grad)" 
                    />
                    <defs>
                        <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default SunLoader;
