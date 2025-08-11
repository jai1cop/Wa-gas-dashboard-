import React from 'react';
import { X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    const baseClasses = "fixed bottom-5 right-5 text-white py-3 px-5 rounded-lg shadow-2xl flex items-center transform transition-all duration-300";
    const typeClasses = {
        error: 'bg-red-600',
        success: 'bg-green-600',
        info: 'bg-blue-600',
    };
    return (
        <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>
            <p className="font-semibold">{message}</p>
            <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Toast;
