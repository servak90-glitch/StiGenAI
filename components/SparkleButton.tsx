
import React from 'react';

interface SparkleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isProcessing?: boolean;
    children: React.ReactNode;
}

const SparkleButton: React.FC<SparkleButtonProps> = ({ isProcessing, children, className, ...props }) => {
    return (
        <button
            className={`sparkle-btn group w-full ${className || ''}`}
            disabled={props.disabled || isProcessing}
            {...props}
        >
            {isProcessing ? (
                 <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin mr-2" />
            ) : (
                <svg height={24} width={24} viewBox="0 0 24 24" className="mr-2">
                    <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
                </svg>
            )}
            <span className="text">{children}</span>
        </button>
    );
};

export default SparkleButton;
