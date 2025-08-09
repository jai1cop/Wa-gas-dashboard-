import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const MetricComparisonCard = ({ title, valueA, valueB, unit = '' }) => {
    const difference = valueB - valueA;
    const percentageChange = valueA !== 0 ? (difference / Math.abs(valueA)) * 100 : 0;

    const getChangeIndicator = () => {
        if (Math.abs(percentageChange) < 0.1) {
            return <Minus className="w-5 h-5 text-gray-500" />;
        }
        if (percentageChange > 0) {
            return <ArrowUp className="w-5 h-5 text-green-500" />;
        }
        return <ArrowDown className="w-5 h-5 text-red-500" />;
    };

    const getChangeColor = () => {
        if (Math.abs(percentageChange) < 0.1) return 'text-gray-600';
        return percentageChange > 0 ? 'text-green-600' : 'text-red-600';
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                    <p className="text-xs text-blue-500">Period A</p>
                    <p className="text-2xl font-bold text-blue-600">{valueA.toFixed(0)}{unit}</p>
                </div>
                <div className="text-left">
                    <p className="text-xs text-green-500">Period B</p>
                    <p className="text-2xl font-bold text-green-600">{valueB.toFixed(0)}{unit}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-center space-x-2">
                {getChangeIndicator()}
                <p className={`text-lg font-bold ${getChangeColor()}`}>
                    {percentageChange.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">change</p>
            </div>
        </div>
    );
};

export default MetricComparisonCard;
