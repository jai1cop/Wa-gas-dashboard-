import React, { useState } from 'react';
import { Bell, Trash2, X } from 'lucide-react';

const metricDisplayNames = {
    totalSupply: 'Total Supply (TJ/day)',
    totalDemand: 'Total Consumption (TJ/day)',
    storageLevel: 'Storage Level (TJ)',
    volatility: '30D Volatility (TJ)',
};

const AlertsManager = ({ alerts, setAlerts, closeModal }) => {
    const [newAlert, setNewAlert] = useState({
        metric: 'totalSupply',
        condition: 'less-than',
        value: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAlert(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAlert = (e) => {
        e.preventDefault();
        if (!newAlert.value || isNaN(parseFloat(newAlert.value))) return;
        const alertToAdd = {
            id: new Date().getTime(), // Simple unique ID
            metric: newAlert.metric,
            condition: newAlert.condition,
            value: parseFloat(newAlert.value)
        };
        setAlerts(prev => [...prev, alertToAdd]);
        setNewAlert({ metric: 'totalSupply', condition: 'less-than', value: '' }); // Reset form
    };

    const handleDeleteAlert = (idToDelete) => {
        setAlerts(prev => prev.filter(alert => alert.id !== idToDelete));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <Bell className="w-6 h-6 mr-3 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Manage Alerts</h2>
                    </div>
                    <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form to add new alert */}
                <form onSubmit={handleAddAlert} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Create a New Alert</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select name="metric" value={newAlert.metric} onChange={handleInputChange} className="p-2 border rounded">
                            <option value="totalSupply">Total Supply</option>
                            <option value="totalDemand">Total Consumption</option>
                            <option value="storageLevel">Storage Level</option>
                            <option value="volatility">30D Volatility</option>
                        </select>
                        <select name="condition" value={newAlert.condition} onChange={handleInputChange} className="p-2 border rounded">
                            <option value="less-than">is less than</option>
                            <option value="greater-than">is greater than</option>
                        </select>
                        <input
                            type="number"
                            name="value"
                            placeholder="Value"
                            value={newAlert.value}
                            onChange={handleInputChange}
                            className="p-2 border rounded"
                            required
                        />
                    </div>
                    <button type="submit" className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition">
                        Add Alert
                    </button>
                </form>

                {/* List of existing alerts */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">Active Alerts</h3>
                    {alerts && alerts.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto pr-2">
                            {alerts.map(alert => (
                                <li key={alert.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm border">
                                    <div>
                                        <span className="font-medium">{metricDisplayNames[alert.metric]}</span>
                                        <span className="text-gray-600"> {alert.condition === 'less-than' ? '<' : '>'} </span>
                                        <span className="font-bold text-blue-700">{alert.value}</span>
                                    </div>
                                    <button onClick={() => handleDeleteAlert(alert.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">You have no active alerts.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsManager;
