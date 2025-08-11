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
                    {message}
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
            <div className="flex items-center mb-4">
                <FlaskConical className="w-6 h-6 mr-3 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Scenario Planner</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                    <select value={scenario.facility} onChange={handleFacilityChange} className="w-full border border-gray-300 rounded px-3 py-2">
                        {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Outage %</label>
                    <input type="number" value={scenario.outagePercent} onChange={handleOutageChange} className="w-full border border-gray-300 rounded px-3 py-2" min="0" max="100" />
                </div>
                <div className="flex items-end">
                    <button onClick={handleToggle} className={`px-4 py-2 rounded mr-2 ${scenario.active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        {scenario.active ? 'Remove Scenario' : 'Apply Scenario'}
                    </button>
                    {scenario.active && <span className="text-sm text-orange-600 font-semibold">Scenario Active</span>}
                </div>
            </div>
        </Card>
    );
};

// Updated main App component
export default function App() {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState('overview');
    const [scenario, setScenario] = useState({ facility: 'Dongara', outagePercent: 10, active: false });
    
    // Generate additional data
    const gsooData = useMemo(generateGSOODemand, []);
    const storageData = useMemo(() => {
        return data.map((d, i) => ({
            date: d.date,
            timestamp: d.timestamp,
            totalVolume: 5000 + Math.sin(i * 0.1) * 1000 + (Math.random() - 0.5) * 200
        }));
    }, [data]);
    
    const volatilityData = useMemo(() => {
        return data.map((d, i) => {
            const baseVolatility = 50;
            const seasonal = Math.sin(i * 0.02) * 20;
            const random = (Math.random() - 0.5) * 30;
            return {
                date: d.date,
                timestamp: d.timestamp,
                volatility: Math.max(0, baseVolatility + seasonal + random)
            };
        });
    }, [data]);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchAemoData();
            if (result.error) {
                setError(result.error);
                setData(generateMockLiveData());
            } else {
                setData(result.data);
            }
        } catch (err) {
            setError('Failed to connect to AEMO servers');
            setData(generateMockLiveData());
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Apply scenario modifications
    const processedData = useMemo(() => {
        if (!scenario.active) return data;
        return data.map(d => {
            const facilityKey = scenario.facility.toLowerCase().replace(/\s+/g, '_');
            if (d[facilityKey] !== undefined) {
                const reduction = d[facilityKey] * (scenario.outagePercent / 100);
                return {
                    ...d,
                    [facilityKey]: d[facilityKey] - reduction,
                    totalSupply: (d.totalSupply || 0) - reduction
                };
            }
            return d;
        });
    }, [data, scenario]);
    
    if (isLoading) return <LoadingSpinner />;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                <PageTitle backAction={currentPage !== 'overview' ? () => setCurrentPage('overview') : null}>
                    WA Gas Dashboard {currentPage !== 'overview' && `- ${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}`}
                </PageTitle>
                
                {error && <ErrorDisplay message={error} />}
                
                <SummaryTiles data={processedData} storageData={storageData} volatility={volatilityData} />
                <div className="mt-6">
                    <StrategySection />
                </div>
                <div className="mt-6">
                    <ScenarioPlanner
                        facilities={Object.keys(PRODUCTION_FACILITIES)}
                        scenario={scenario}
                        setScenario={setScenario}
                    />
                </div>
            </div>
        </div>
    );
}
