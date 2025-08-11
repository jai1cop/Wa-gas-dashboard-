import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart, Bar, Line, AreaChart, Area as RechartsArea, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, ComposedChart, ReferenceArea, Brush } from 'recharts';
import { ChevronUp, ChevronDown, Settings, ArrowLeft, AlertTriangle, Loader, Users, Database, TrendingUp, Zap, Lightbulb, BarChart2, Activity, FlaskConical } from 'lucide-react';
import { fetchAemoData } from './api';
import { STORAGE_COLORS, VOLATILITY_COLOR, PRODUCTION_FACILITIES, DATA_TO_DISPLAY_NAME_MAP, GSOO_HISTORICAL_DEMAND, FACILITY_CAPACITIES } from './config';
import { generateMockLiveData } from './mockData';

const generateGSOODemand = () => {
    const medianDemand = Object.values(GSOO_HISTORICAL_DEMAND).reduce((sum, val) => sum + val, 0) / Object.values(GSOO_HISTORICAL_DEMAND).length;
    const data = [];
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('en-CA'),
            timestamp: date.getTime(),
            gsooMedianDemand: medianDemand + (Math.random() - 0.5) * 100
        });
    }
    return data;
};

// --- HELPER COMPONENTS ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 ${className}`}>{children}</div>;

const PageTitle = ({ children, backAction }) => (
    <div className="flex items-center mb-6">
        {backAction && <button onClick={backAction} className="p-2 rounded-full hover:bg-gray-200 mr-4"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{children}</h1>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-96">
        <Loader className="w-16 h-16 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Connecting to AEMO GBB (loading 2 years of data)...</p>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <Card className="border-l-4 border-red-500">
        <div className="flex">
            <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Failed to Load Live Data</h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                    <p className="mt-1 font-bold">Displaying sample data instead. Please check your network or proxy settings.</p>
                </div>
            </div>
        </div>
    </Card>
);

// --- NEWLY DEFINED UI COMPONENTS ---
const SummaryTiles = ({ data, storageData, volatility }) => {
    const latestData = data[data.length - 1] || {};
    const latestStorage = storageData[storageData.length - 1] || {};
    const latestVolatility = volatility[volatility.length - 1] || {};

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <div className="flex items-center">
                    <Zap className="w-8 h-8 text-green-500 mr-4" />
                    <div>
                        <p className="text-sm text-gray-500">Total Supply</p>
                        <p className="text-2xl font-bold">{latestData.totalSupply?.toFixed(0) || 'N/A'} TJ/day</p>
                    </div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-500 mr-4" />
                    <div>
                        <p className="text-sm text-gray-500">Total Consumption</p>
                        <p className="text-2xl font-bold">{latestData.totalDemand?.toFixed(0) || 'N/A'} TJ/day</p>
                    </div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center">
                    <Database className="w-8 h-8 text-purple-500 mr-4" />
                    <div>
                        <p className="text-sm text-gray-500">Storage Level</p>
                        <p className="text-2xl font-bold">{latestStorage.totalVolume?.toFixed(0) || 'N/A'} TJ</p>
                    </div>
                </div>
            </Card>
            <Card>
                <div className="flex items-center">
                    <Activity className="w-8 h-8 text-red-500 mr-4" />
                    <div>
                        <p className="text-sm text-gray-500">30D Volatility</p>
                        <p className="text-2xl font-bold">{latestVolatility.volatility?.toFixed(1) || 'N/A'} TJ</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const StrategySection = () => (
    <Card>
        <div className="flex items-center mb-2">
            <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-800">Market Insights & Strategy</h2>
        </div>
        <p className="text-sm text-gray-600">
            The WA gas market is currently in a near-term surplus, but forecasts indicate a potential supply gap in 2028, followed by a growing deficit from 2030. This suggests opportunities for flexible supply sources and storage solutions to manage increasing demand variability, especially with the rise of gas-powered generation to support renewables.
        </p>
    </Card>
);

const ScenarioPlanner = ({ facilities, scenario, setScenario, onApply }) => {
    const handleFacilityChange = (e) => setScenario(s => ({ ...s, facility: e.target.value }));
    const handleOutageChange = (e) => setScenario(s => ({ ...s, outagePercent: Number(e.target.value) }));
    const handleToggle = () => setScenario(s => ({ ...s, active: !s.active }));

    return (
        <Card>
