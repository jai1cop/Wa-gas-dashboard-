import React from 'react';
import { Zap, TrendingUp, Database, Activity } from 'lucide-react';
import Card from './Card';

const KeyMetrics = ({ data, storageData, volatility }) => {
    const latestData = data[data.length - 1] || {};
    const latestStorage = storageData[storageData.length - 1] || {};
    const latestVolatility = volatility[volatility.length - 1] || {};

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card><div className="flex items-center"><Zap className="w-8 h-8 text-green-500 mr-4" /><div><p className="text-sm text-gray-500">Total Supply</p><p className="text-2xl font-bold">{latestData.totalSupply?.toFixed(0) || 'N/A'} TJ/day</p></div></div></Card>
            <Card><div className="flex items-center"><TrendingUp className="w-8 h-8 text-blue-500 mr-4" /><div><p className="text-sm text-gray-500">Total Consumption</p><p className="text-2xl font-bold">{latestData.totalDemand?.toFixed(0) || 'N/A'} TJ/day</p></div></div></Card>
            <Card><div className="flex items-center"><Database className="w-8 h-8 text-purple-500 mr-4" /><div><p className="text-sm text-gray-500">Storage Level</p><p className="text-2xl font-bold">{latestStorage.totalVolume?.toFixed(0) || 'N/A'} TJ</p></div></div></Card>
            <Card><div className="flex items-center"><Activity className="w-8 h-8 text-red-500 mr-4" /><div><p className="text-sm text-gray-500">30D Volatility</p><p className="text-2xl font-bold">{latestVolatility.volatility?.toFixed(1) || 'N/A'} TJ</p></div></div></Card>
        </div>
    );
};

export default KeyMetrics;
