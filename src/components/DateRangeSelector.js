import React from 'react';

const DateRangeSelector = ({ period, setPeriod, color = 'blue' }) => {
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setPeriod(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className={`p-4 border-l-4 border-${color}-500 bg-gray-50 rounded-r-lg`}>
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <label htmlFor={`start-${color}`} className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                        type="date"
                        id={`start-${color}`}
                        name="start"
                        value={period.start}
                        onChange={handleDateChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor={`end-${color}`} className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                        type="date"
                        id={`end-${color}`}
                        name="end"
                        value={period.end}
                        onChange={handleDateChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateRangeSelector;
