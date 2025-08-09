import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const metricDisplayNames = {
    totalSupply: 'Total Supply',
    totalDemand: 'Total Consumption',
    storageLevel: 'Storage Level',
    volatility: '30D Volatility',
};

const AlertNotification = ({ triggeredAlerts, setTriggeredAlerts }) => {
    if (!triggeredAlerts || triggeredAlerts.length === 0) {
        return null;
    }

    const handleDismiss = (idToDismiss) => {
        setTriggeredAlerts(prev => prev.filter(alert => alert.id !== idToDismiss));
    };

    return (
        <div className="fixed top-28 right-4 w-full max-w-sm z-50 space-y-3">
            {triggeredAlerts.map(alert => (
                <div key={alert.id} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-3 flex-grow">
                        <p className="font-bold">Alert Triggered!</p>
                        <p className="text-sm">
                            {metricDisplayNames[alert.metric]} ({alert.actualValue.toFixed(0)}) has {alert.condition === 'less-than' ? 'fallen below' : 'exceeded'} your threshold of {alert.value}.
                        </p>
                    </div>
                    <button onClick={() => handleDismiss(alert.id)} className="ml-4 p-1 rounded-full hover:bg-red-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AlertNotification;
