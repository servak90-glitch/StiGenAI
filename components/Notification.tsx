
import React, { useEffect, useState } from 'react';
import { NotificationType } from '../types';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [message, type, onDismiss]);

    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-xl shadow-lg text-white text-sm font-semibold max-w-md transition-all duration-300 ease-in-out";
    const typeClasses: Record<NotificationType, string> = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-sky-500',
        warning: 'bg-yellow-500 text-yellow-900',
    };
    const visibilityClasses = visible ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-full opacity-0';

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`}>
            {message}
        </div>
    );
};

export default Notification;
