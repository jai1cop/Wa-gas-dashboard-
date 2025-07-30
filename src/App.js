import React, { useState, useMemo, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Area, ComposedChart } from 'recharts';
import { ChevronUp, ChevronDown, Settings, ArrowLeft, AlertTriangle, Loader } from 'lucide-react';

// --- API & CONFIGURATION ---
const AEMO_API_BASE_URL = "https://gbbwa.aemo.com.au/api/v1/report";

// Helper to get a date string in YYYY-MM-DD format
const getISODateString = (date) => {
    return date.toISOString().split('T')[0];
};

// --- HELPER COMPONENTS ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

const PageTitle = ({ children, backAction }) => (
    <div className="flex items-center mb-6">
        {backAction && (
            <button onClick={backAction} className="p-2 rounded-full hover:bg-gray-200 mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{children}</h1>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-96">
        <Loader className="w-16 h-16 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Connecting to AEMO GBB...</p>
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
                    <p className="mt-1">Please try again later. The AEMO API may be temporarily unavailable.</p>
                </div>
            </div>
        </div>
    </Card>
);


// --- CHART COMPONENTS ---

function SupplyDemandChart({ data, facilityInfo }) {
    const [dateRange, setDateRange] = useState({ start: data[data.length - 90]?.timestamp, end: data[data.length - 1]?.timestamp });

    const filteredData = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return data;
        return data.filter(d => d.timestamp >= dateRange.start && d.timestamp <= dateRange.end);
    }, [data, dateRange]);

    const resetZoom = () => {
        setDateRange({ start: data[data.length - 90]?.timestamp, end: data[data.length - 1]?.timestamp });
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">WA Gas Supply-Demand Balance</h2>
                    <p className="text-sm text-gray-500">Live data from AEMO GBB (Actuals D-2).</p>
                </div>
                <button onClick={resetZoom} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Reset Zoom</button>
            </div>
            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer>
                    <ComposedChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem', border: '1px solid #ccc' }}
                            formatter={(value, name) => [typeof value === 'number' ? value.toFixed(0) : value, name]}
                        />
                        <Legend />
                        
                        <Area type="monotone" dataKey="demandMedianRange" fill="#e5e7eb" stroke="none" name="Demand Median Range" />
                        
                        {Object.keys(facilityInfo).filter(f => facilityInfo[f].type === 'Production').map(facility => (
                            <Bar key={facility} dataKey={facility} stackId="supply" fill={facilityInfo[facility].color} name={facility} />
                        ))}
                        
                        <Line type="monotone" dataKey="totalDemand" stroke="#374151" strokeWidth={2} dot={false} name="Total Demand" />
                        <Line type="monotone" dataKey="lastYearDemand" stroke="#000000" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Prev. 12-Month Demand" />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function MediumTermCapacityChart({data}) {
     return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Medium Term Capacity Outlook</h2>
            <p className="text-sm text-gray-500 mb-4">Live Outage & Maintenance Schedule from AEMO</p>
            <div className="h-96 overflow-y-auto pr-2">
                {data.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Facility</th>
                                <th scope="col" className="px-4 py-3">Dates</th>
                                <th scope="col" className="px-4 py-3">Capacity (TJ/d)</th>
                                <th scope="col" className="px-4 py-3">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.rowId} className="bg-white border-b">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.facilityName}</td>
                                    <td className="px-4 py-3">{item.startGasDay} to {item.endGasDay}</td>
                                    <td className="px-4 py-3 font-mono text-red-600">{item.capacity}</td>
                                    <td className="px-4 py-3">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 pt-16">No medium-term capacity constraints reported by AEMO.</p>
                )}
            </div>
        </Card>
    );
}

// --- UI & LAYOUT COMPONENTS ---

function FacilityControls({ facilityInfo, activeFacilities, setActiveFacilities }) {
    const [isOpen, setIsOpen] = useState(false);
    const zones = [...new Set(Object.values(facilityInfo).map(f => f.zone))];

    const handleToggle = (facility) => {
        setActiveFacilities(prev => ({ ...prev, [facility]: !prev[facility] }));
    };

    const handleZoneToggle = (zone, value) => {
        const updatedFacilities = { ...activeFacilities };
        Object.keys(facilityInfo).forEach(facility => {
            if (facilityInfo[facility].zone === zone) {
                updatedFacilities[facility] = value;
            }
        });
        setActiveFacilities(updatedFacilities);
    };

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-md text-lg font-semibold text-gray-700">
                <div className="flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-blue-600" />
                    <span>Manage Facilities</span>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 z-10">
                    <p className="text-sm text-gray-600 mb-4">Select facilities to include in the supply stack.</p>
                    {zones.map(zone => (
                        <div key={zone} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-700">{zone}</h4>
                                <div>
                                    <button onClick={() => handleZoneToggle(zone, true)} className="text-xs text-blue-600 hover:underline mr-2">All</button>
                                    <button onClick={() => handleZoneToggle(zone, false)} className="text-xs text-blue-600 hover:underline">None</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(facilityInfo).filter(f => facilityInfo[f].zone === zone).map(facility => (
                                    <label key={facility} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!activeFacilities[facility]}
                                            onChange={() => handleToggle(facility)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-800">{facility}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SummaryTiles({ data }) {
    if (!data || data.length === 0) return null;
    const latestData = data[data.length - 1];
    const balance = latestData.totalSupply - latestData.totalDemand;
    
    const storageFacilities = Object.keys(latestData).filter(key => key.toLowerCase().includes('tubridgi') || key.toLowerCase().includes('mondarra'));
    const storageFlow = storageFacilities.reduce((acc, facility) => acc + (latestData[facility] || 0), 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card className="text-center">
                <h3 className="text-sm font-medium text-gray-500">Supply/Demand Balance (D-2)</h3>
                <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">TJ/day</p>
            </Card>
            <Card className="text-center">
                <h3 className="text-sm font-medium text-gray-500">Storage Flow (D-2)</h3>
                <p className={`text-3xl font-bold ${storageFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                    {storageFlow.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">{storageFlow >= 0 ? 'Net Injection' : 'Net Withdrawal'}</p>
            </Card>
        </div>
    );
}

// --- PAGE COMPONENTS ---

function DashboardPage({ liveData, activeFacilities, setActiveFacilities, navigateTo }) {
    return (
        <div className="space-y-6">
            <SummaryTiles data={liveData.processedFlows} />
            <FacilityControls facilityInfo={liveData.facilityInfo} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} />
            <SupplyDemandChart data={liveData.processedFlows} facilityInfo={liveData.facilityInfo} />
            <MediumTermCapacityChart data={liveData.mediumTermCapacity} />
             <div className="grid grid-cols-1">
                <Card className="flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-bold text-gray-800">Yara Pilbara Impact</h2>
                    <p className="text-sm text-gray-600 my-2">Model the market impact of changes in Yara's gas consumption.</p>
                    <button onClick={() => navigateTo('yara')} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Open Scenario Planner
                    </button>
                </Card>
            </div>
        </div>
    );
}

function YaraPage({ yaraAdjustment, setYaraAdjustment, navigateTo }) {
    // This page remains as a simulator on top of live data
    const [localAdjustment, setLocalAdjustment] = useState(yaraAdjustment);
    
    const handleApply = () => {
        setYaraAdjustment(localAdjustment);
        navigateTo('dashboard');
    };

    return (
        <div>
            <PageTitle backAction={() => navigateTo('dashboard')}>Yara Pilbara Scenario Planner</PageTitle>
            <Card className="flex flex-col justify-center max-w-md mx-auto">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Adjust Market Demand</h2>
                <p className="text-sm text-gray-600 text-center mb-6">
                    Increase or reduce Yara's assumed consumption to see its effect on the overall WA gas market balance. This adjustment will be applied to the live demand data.
                </p>
                <div className="flex items-center justify-center space-x-4 mb-4">
                    <button onClick={() => setLocalAdjustment(v => v - 10)} className="w-12 h-12 rounded-full bg-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-300">-</button>
                    <div className="text-center">
                        <p className={`text-4xl font-bold ${localAdjustment > 0 ? 'text-red-500' : localAdjustment < 0 ? 'text-green-500' : 'text-gray-800'}`}>
                            {localAdjustment >= 0 ? '+' : ''}{localAdjustment}
                        </p>
                        <p className="text-sm text-gray-500">TJ/day</p>
                    </div>
                    <button onClick={() => setLocalAdjustment(v => v + 10)} className="w-12 h-12 rounded-full bg-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-300">+</button>
                </div>
                <p className="text-xs text-center text-gray-500 mb-6">This value will be added to the total market demand.</p>
                <button onClick={handleApply} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Apply Scenario & View Dashboard
                </button>
            </Card>
        </div>
    );
}

// --- MAIN APP COMPONENT ---

export default function App() {
    const [page, setPage] = useState('dashboard');
    const [yaraAdjustment, setYaraAdjustment] = useState(0);
    const [activeFacilities, setActiveFacilities] = useState({});
    
    const [liveData, setLiveData] = useState({
        processedFlows: [],
        facilityInfo: {},
        mediumTermCapacity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch facility info from Capacity Outlook to understand who is who
                const capacityRes = await fetch(`${AEMO_API_BASE_URL}/capacityOutlook/current`);
                if (!capacityRes.ok) throw new Error(`Failed to fetch Capacity Outlook: ${capacityRes.statusText}`);
                const capacityData = await capacityRes.json();
                
                const facilityInfo = {};
                const colors = ["#06b6d4", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#d946ef", "#6b7280"];
                let colorIndex = 0;

                capacityData.rows.forEach(row => {
                    if (!facilityInfo[row.facilityName]) {
                        let type = 'Other';
                        if (row.capacityType.includes('Production')) type = 'Production';
                        if (row.capacityType.includes('Storage')) type = 'Storage';
                        
                        let zone = 'Unknown';
                        if (row.facilityName.includes('Varanus') || row.facilityName.includes('Devil') || row.facilityName.includes('Macedon') || row.facilityName.includes('Wheatstone') || row.facilityName.includes('North West Shelf') || row.facilityName.includes('Scarborough')) {
                            zone = 'Pilbara';
                        } else if (type === 'Storage') {
                            zone = 'Storage';
                        }

                        facilityInfo[row.facilityName] = { 
                            type, 
                            zone, 
                            color: colors[colorIndex % colors.length]
                        };
                        colorIndex++;
                    }
                });

                // 2. Fetch last 90 days of Actual Flow data
                const datePromises = [];
                const today = new Date();
                for (let i = 2; i < 92; i++) { // AEMO data is for D-2, so start from 2 days ago
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    datePromises.push(fetch(`${AEMO_API_BASE_URL}/actualFlow/${getISODateString(date)}`));
                }

                const responses = await Promise.all(datePromises);
                const flowReports = await Promise.all(responses.map(res => res.ok ? res.json() : null));

                // 3. Process the flow data
                const dailyData = {};
                flowReports.filter(report => report).forEach(report => {
                    const date = report.gasDay;
                    if (!dailyData[date]) {
                        dailyData[date] = {
                            date: new Date(date).toLocaleDateString('en-CA'),
                            timestamp: new Date(date).getTime(),
                            totalDemand: 0,
                            totalSupply: 0,
                        };
                    }

                    report.rows.forEach(row => {
                        const info = facilityInfo[row.facilityName];
                        if (info?.type === 'Production') {
                            dailyData[date][row.facilityName] = (dailyData[date][row.facilityName] || 0) + (row.receipt || 0);
                            dailyData[date].totalSupply += (row.receipt || 0);
                        } else if (info?.type === 'Storage') {
                             dailyData[date][row.facilityName] = (dailyData[date][row.facilityName] || 0) + (row.receipt || 0) - (row.delivery || 0);
                        }
                        
                        if (row.delivery) {
                            dailyData[date].totalDemand += row.delivery;
                        }
                    });
                });
                
                const processedFlows = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
                
                // 4. Add Yara adjustment to demand
                const finalFlows = processedFlows.map(d => ({...d, totalDemand: d.totalDemand + yaraAdjustment }));

                // 5. Fetch Medium Term Capacity
                const mtcRes = await fetch(`${AEMO_API_BASE_URL}/mediumTermCapacity/current`);
                if (!mtcRes.ok) throw new Error(`Failed to fetch Medium Term Capacity: ${mtcRes.statusText}`);
                const mtcData = await mtcRes.json();

                // 6. Set all data and initial active facilities
                setLiveData({
                    processedFlows: finalFlows,
                    facilityInfo,
                    mediumTermCapacity: mtcData.rows
                });

                const initialActive = {};
                Object.keys(facilityInfo).forEach(name => {
                    initialActive[name] = true; // Default all to on
                });
                setActiveFacilities(initialActive);

            } catch (err) {
                console.error("AEMO API Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAndProcessData();
    }, [yaraAdjustment]); // Refetch if yaraAdjustment changes

    const navigateTo = (targetPage) => setPage(targetPage);
    
    // Filter data based on active facilities
    const filteredLiveData = useMemo(() => {
        if (!liveData.processedFlows) return liveData;

        const newFlows = liveData.processedFlows.map(day => {
            const newDay = { ...day, totalSupply: 0 };
            Object.keys(activeFacilities).forEach(facilityName => {
                if (activeFacilities[facilityName] && liveData.facilityInfo[facilityName]?.type === 'Production') {
                    newDay.totalSupply += (day[facilityName] || 0);
                } else {
                    newDay[facilityName] = 0; // Set to 0 if not active
                }
            });
            return newDay;
        });
        return {...liveData, processedFlows: newFlows };

    }, [liveData, activeFacilities]);


    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1>
                    <p className="text-sm text-gray-500">Live Data from AEMO Gas Bulletin Board (WA)</p>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {!loading && !error && page === 'dashboard' && (
                    <DashboardPage 
                        liveData={filteredLiveData} 
                        activeFacilities={activeFacilities}
                        setActiveFacilities={setActiveFacilities}
                        navigateTo={navigateTo}
                    />
                )}
                {!loading && !error && page === 'yara' && (
                    <YaraPage 
                        yaraAdjustment={yaraAdjustment}
                        setYaraAdjustment={setYaraAdjustment}
                        navigateTo={navigateTo}
                    />
                )}
            </main>
            <footer className="text-center py-4">
                <p className="text-xs text-gray-500">Dashboard data sourced from AEMO GBB API. Last updated: {new Date().toLocaleString()}.</p>
            </footer>
        </div>
    );
}

