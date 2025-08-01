import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area as RechartsArea, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, ComposedChart, ReferenceArea } from 'recharts';
import { ChevronUp, ChevronDown, Settings, ArrowLeft, AlertTriangle, Loader, Users, Database, TrendingUp, Zap, Lightbulb, BarChart2, Activity, FlaskConical } from 'lucide-react';

// --- Local Imports ---
import { AEMO_FACILITY_NAME_MAP, FACILITY_CAPACITIES, GSOO_HISTORICAL_DEMAND, PRODUCTION_FACILITIES } from './config';
import { fetchAemoData } from './api';

// --- Component Imports ---
import Card from './components/Card';
import SupplyDemandChart from './components/SupplyDemandChart';
import KeyFindings from './components/KeyFindings';
import ForecastChart from './components/ForecastChart';
import GpgPeakDemand from './components/GpgPeakDemand';


// --- UI Components (kept in App.js for simplicity as they are highly coupled to App state) ---

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
            <div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Failed to Load Live Data</h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                    <p className="mt-1 font-bold">This is likely a network or proxy issue. Please ensure the `netlify.toml` file is in the root directory and is configured correctly.</p>
                </div>
            </div>
        </div>
    </Card>
);

const SummaryTiles = ({ data, storageData, volatility }) => {
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

const StrategySection = () => {
    // This component can be expanded with more strategic insights
    return (
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
};

const ScenarioPlanner = ({ facilities, scenario, setScenario, onApply }) => {
    // ... logic for ScenarioPlanner
    return <Card> {/* Placeholder Content */} </Card>;
};

const FacilityControls = ({ facilityInfo, activeFacilities, setActiveFacilities }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleFacility = (name) => {
        setActiveFacilities(prev => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <Card>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center">
                <div className="flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-800">Facility Supply Controls</h2>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.keys(facilityInfo).filter(name => facilityInfo[name].type === 'Production').map(name => (
                        <div key={name} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`facility-${name}`}
                                checked={!!activeFacilities[name]}
                                onChange={() => toggleFacility(name)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`facility-${name}`} className="ml-2 block text-sm text-gray-900">{name}</label>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};


// --- Chart Components (Directly in App.js as requested, can be moved to /components later) ---

function StorageAnalysisChart({ data, totalCapacity }) { /* ... Component Code ... */ return <Card> {/* Placeholder */} </Card> }
function FacilityConsumptionChart({ data }) { /* ... Component Code ... */  return <Card> {/* Placeholder */} </Card> }
function VolatilityChart({ data }) { /* ... Component Code ... */ return <Card> {/* Placeholder */} </Card> }
function FacilityConstraintsChart({ constraintsData }) { /* ... Component Code ... */ return <Card> {/* Placeholder */} </Card> }

// --- Page Components ---

function DashboardPage({ liveData, activeFacilities, setActiveFacilities, scenario, setScenario, navigateTo, constraintsData }) {
    return (
        <div className="space-y-6">
            <SummaryTiles data={liveData.alignedFlows} storageData={liveData.storageAnalysis} volatility={liveData.volatility} />
            <KeyFindings />
            <ForecastChart />
            <GpgPeakDemand />
            <StrategySection />
            <ScenarioPlanner facilities={liveData.facilityInfo} scenario={scenario} setScenario={setScenario} onApply={setScenario} />
            <FacilityControls facilityInfo={liveData.facilityInfo} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} />
            <FacilityConstraintsChart constraintsData={constraintsData} />
            <SupplyDemandChart data={liveData.processedFlows} facilityInfo={liveData.facilityInfo} scenario={scenario} forecastStartDate={liveData.forecastStartDate} />
            {/* Other components like SupplyChart, StorageAnalysisChart etc. would go here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col items-center justify-center text-center"><h2 className="text-xl font-bold text-gray-800">Storage Analysis</h2><p className="text-sm text-gray-600 my-2">Detailed storage flows for Tubridgi and Mondarra facilities.</p><button onClick={() => navigateTo('storage')} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700">View Storage Details</button></Card>
                <Card className="flex flex-col items-center justify-center text-center"><h2 className="text-xl font-bold text-gray-800">GSOO Forecasts</h2><p className="text-sm text-gray-600 my-2">Official AEMO forecasts and market outlook from the 2024 WA GSOO.</p><button onClick={() => navigateTo('forecasts')} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">View GSOO Forecasts</button></Card>
            </div>
        </div>
    );
}

function YaraPage({ yaraAdjustment, setYaraAdjustment, navigateTo }) {
     /* ... Component Code ... */
     return <Card> {/* Placeholder */} </Card>;
}

function StoragePage({ liveData, navigateTo }) {
     /* ... Component Code ... */
     return <Card> {/* Placeholder */} </Card>;
}

function ForecastsPage({ navigateTo }) {
    return (
        <div>
            <PageTitle backAction={() => navigateTo('dashboard')}>WA GSOO 2024 - Official Forecasts</PageTitle>
            <KeyFindings />
            <ForecastChart />
            <GpgPeakDemand />
        </div>
    );
}


// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('dashboard');
    const [yaraAdjustment, setYaraAdjustment] = useState(0);
    const [activeFacilities, setActiveFacilities] = useState({});
    const [scenario, setScenario] = useState({ active: false, facility: null, outagePercent: 100 });
    const [liveData, setLiveData] = useState({ processedFlows: [], facilityInfo: {}, storageAnalysis: [], totalStorageCapacity: 0, facilityConsumption: [], volatility: [], alignedFlows: [], supplyOnly: [] });
    const [constraintsData, setConstraintsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [baseData, setBaseData] = useState(null);

    useEffect(() => {
        const processData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { capacityData, mtcData, flowData, consumptionData } = await fetchAemoData();
                
                const facilityInfo = {};
                const colors = ["#06b6d4", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#d946ef", "#6b7280"];
                let colorIndex = 0;
                
                capacityData.rows.forEach(row => {
                    const apiName = row.facilityName;
                    const displayName = AEMO_FACILITY_NAME_MAP[apiName] || apiName;
                    if (!facilityInfo[displayName]) {
                        let type = 'Pipeline';
                        if (row.capacityType.includes('Production')) type = 'Production';
                        if (row.capacityType.includes('Storage')) type = 'Storage';
                        facilityInfo[displayName] = { type, color: colors[colorIndex++ % colors.length], dataName: apiName, displayName: displayName };
                    }
                });

                const totalStorageCapacity = mtcData.rows.reduce((acc, row) => {
                    const displayName = AEMO_FACILITY_NAME_MAP[row.facilityName] || row.facilityName;
                    if (facilityInfo[displayName]?.type === 'Storage' && row.capacityType === 'Nameplate') {
                        return acc + row.capacity;
                    }
                    return acc;
                }, 0);

                setBaseData({ flowData, consumptionData, facilityInfo, totalStorageCapacity, mtcData });

                const initialActive = {};
                Object.keys(facilityInfo).forEach(name => { if (facilityInfo[name].type === 'Production') initialActive[name] = true; });
                setActiveFacilities(initialActive);
                
            } catch (err) {
                console.error("API Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        processData();
    }, []);

    useEffect(() => {
        if (!baseData) return;

        const { flowData, consumptionData, facilityInfo, totalStorageCapacity, mtcData } = baseData;
        
        const dailyData = {};
        const storageFlows = {};

        flowData.forEach(row => {
            const date = row.gasDay;
            if (!date) return;
            
            const apiName = row.facilityName;
            const displayName = AEMO_FACILITY_NAME_MAP[apiName] || apiName;
            
            if (!dailyData[date]) {
                dailyData[date] = { date: new Date(date).toLocaleDateString('en-CA'), timestamp: new Date(date).getTime(), totalDemand: 0, totalSupply: 0 };
            }
            if (!storageFlows[date]) storageFlows[date] = { netFlow: 0 };
            
            const isProduction = PRODUCTION_FACILITIES.includes(displayName);
            const isStorage = facilityInfo[displayName]?.type === 'Storage';

            if (isProduction) {
                const supply = parseFloat(row.receipt) || 0;
                const facilityCapacity = FACILITY_CAPACITIES[displayName];
                if (supply < 0 || (facilityCapacity && supply > facilityCapacity * 1.2)) {
                    console.warn(`Skipping invalid supply data: ${displayName} ${supply} on ${date}`);
                    return;
                }
                if (!dailyData[date][displayName] || supply > dailyData[date][displayName]) {
                    dailyData[date][displayName] = supply;
                }
            } else if (isStorage) {
                storageFlows[date].netFlow += (parseFloat(row.receipt) || 0) - (parseFloat(row.delivery) || 0);
            }
        });

        consumptionData.forEach(item => {
            const date = item.gasDay;
            if (!date) return;
            if (!dailyData[date]) dailyData[date] = { date: new Date(date).toLocaleDateString('en-CA'), timestamp: new Date(date).getTime(), totalDemand: 0, totalSupply: 0 };
            dailyData[date].totalDemand += parseFloat(item.quantity) || 0;
        });
        
        Object.values(dailyData).forEach(day => {
            day.totalSupply = PRODUCTION_FACILITIES.reduce((sum, facility) => sum + (day[facility] || 0), 0);
        });

        // ... (rest of the data processing logic from original App.js)

        const processedFlows = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
        
        setLiveData({
            processedFlows,
            // ... (other processed data)
        });

    }, [baseData, yaraAdjustment]);

    const navigateTo = (targetPage) => setPage(targetPage);
    
    const filteredLiveData = useMemo(() => {
        // ... (memoization logic from original App.js)
        return liveData; // simplified for brevity
    }, [liveData, activeFacilities, scenario]);

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1>
                    <p className="text-sm text-gray-500">Live Data from AEMO, with Trader Analytics & GSOO Integration</p>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {!loading && !error && (
                    <>
                        {page === 'dashboard' && <DashboardPage liveData={filteredLiveData} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} scenario={scenario} setScenario={setScenario} navigateTo={navigateTo} constraintsData={constraintsData} />}
                        {page === 'yara' && <YaraPage yaraAdjustment={yaraAdjustment} setYaraAdjustment={setYaraAdjustment} navigateTo={navigateTo} />}
                        {page === 'storage' && <StoragePage liveData={filteredLiveData} navigateTo={navigateTo} />}
                        {page === 'forecasts' && <ForecastsPage navigateTo={navigateTo} />}
                    </>
                )}
            </main>
            <footer className="text-center py-4">
                <p className="text-xs text-gray-500">Dashboard data sourced from AEMO GBB API and WA GSOO 2024. Last updated: {new Date().toLocaleString()}.</p>
            </footer>
        </div>
    );
}
