import React, { useState, useMemo, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Cell, ReferenceLine, ReferenceArea, BarChart, AreaChart, Area as RechartsArea } from 'recharts';
import { ChevronUp, ChevronDown, Settings, ArrowLeft, AlertTriangle, Loader, Users, Database, TrendingUp, Zap } from 'lucide-react';

// --- API & CONFIGURATION ---
const AEMO_API_BASE_URL = "/api/report";

// Helper to get a date string in YYYY-MM-DD format
const getISODateString = (date) => date.toISOString().split('T')[0];
const getYYYYMMString = (date) => date.toISOString().slice(0, 7);

const STORAGE_COLORS = { injection: '#22c55e', withdrawal: '#dc2626', volume: '#0ea5e9' };
const VOLATILITY_COLOR = '#8884d8';

// --- HELPER FUNCTIONS ---
const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index] ? values[index].trim() : '';
            return obj;
        }, {});
    });
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
    <Card className="border-l-4 border-red-500"><div className="flex"><div className="flex-shrink-0"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div className="ml-3"><h3 className="text-lg font-medium text-red-800">Failed to Load Live Data</h3><div className="mt-2 text-sm text-red-700"><p>{message}</p><p className="mt-1 font-bold">This is likely a network or proxy issue. Please ensure the `netlify.toml` file is in the root directory and is configured correctly.</p></div></div></div></Card>
);

// --- CHART COMPONENTS ---
function SupplyDemandChart({ data, facilityInfo, scenario }) {
    const [dateRange, setDateRange] = useState({ start: data[data.length - 90]?.timestamp, end: data[data.length - 1]?.timestamp });
    const filteredData = useMemo(() => data.filter(d => d.timestamp >= dateRange.start && d.timestamp <= dateRange.end), [data, dateRange]);
    const resetZoom = () => setDateRange({ start: data[data.length - 90]?.timestamp, end: data[data.length - 1]?.timestamp });

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div><h2 className="text-xl font-bold text-gray-800">WA Gas Production vs. Consumption</h2><p className="text-sm text-gray-500">Actual supply from Production Facilities vs. actual Large User Consumption (D-7).</p></div>
                <button onClick={resetZoom} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Reset Zoom</button>
            </div>
            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer>
                    <ComposedChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem', border: '1px solid #ccc' }} formatter={(value, name) => [typeof value === 'number' ? value.toFixed(0) : value, name]} />
                        <Legend />
                        {Object.keys(facilityInfo).filter(f => facilityInfo[f].type === 'Production').map(facility => <Bar key={facility} dataKey={facility} stackId="supply" fill={facilityInfo[facility].color} name={facility} />)}
                        {scenario.active && <Line type="monotone" dataKey="simulatedSupply" stroke="#e11d48" strokeWidth={3} dot={false} name="Simulated Supply" />}
                        <Line type="monotone" dataKey="totalDemand" stroke="#374151" strokeWidth={2} dot={false} name="Total Consumption" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function StorageAnalysisChart({ data, totalCapacity }) {
    return (
        <Card>
            <div className="flex items-center mb-1"><Database className="w-6 h-6 mr-3 text-blue-600" /><h2 className="text-xl font-bold text-gray-800">Storage Inventory Analysis</h2></div>
            <p className="text-sm text-gray-500 mb-4">Daily net injections/withdrawals and estimated total inventory.</p>
            <div style={{ width: '100%', height: 352 }}>
                <ResponsiveContainer>
                    <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Net Flow (TJ/d)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke={STORAGE_COLORS.volume} label={{ value: 'Total Inventory (TJ)', angle: 90, position: 'insideRight' }} />
                        <Tooltip formatter={(value, name) => [`${value.toFixed(0)} TJ`, name]} />
                        <Legend />
                        <ReferenceLine y={totalCapacity} yAxisId="right" label={{ value: `Max Capacity (${totalCapacity} TJ)`, position: 'insideTopRight', fill: '#6b7280' }} stroke="red" strokeDasharray="3 3" />
                        <Bar yAxisId="left" dataKey="netFlow" name="Net Injection/Withdrawal">{data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.netFlow >= 0 ? STORAGE_COLORS.injection : STORAGE_COLORS.withdrawal} />)}</Bar>
                        <Line yAxisId="right" type="monotone" dataKey="totalVolume" name="Estimated Total Inventory" stroke={STORAGE_COLORS.volume} strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function FacilityConsumptionChart({ data }) {
    const topConsumers = useMemo(() => {
        if (!data || data.length === 0) return [];
        const latestGasDay = data.reduce((max, d) => d.gasDay > max ? d.gasDay : max, data[0].gasDay);
        return data.filter(d => d.gasDay === latestGasDay).sort((a, b) => b.quantity - a.quantity);
    }, [data]);
    const latestDateFormatted = useMemo(() => topConsumers.length > 0 ? new Date(topConsumers[0].gasDay).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', [topConsumers]);

    return (
        <Card>
            <div className="flex items-center mb-1"><Users className="w-6 h-6 mr-3 text-blue-600" /><h2 className="text-xl font-bold text-gray-800">Top Consumers</h2></div>
            <p className="text-sm text-gray-500 mb-4">Individual large user consumption for {latestDateFormatted} (D-7).</p>
            <div className="h-96 overflow-y-auto pr-2">
                <ResponsiveContainer width="100%" height={topConsumers.length * 40}>
                    <BarChart layout="vertical" data={topConsumers} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="facilityName" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${value.toFixed(1)} TJ`} />
                        <Bar dataKey="quantity" name="Consumption" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function VolatilityChart({ data }) {
    return (
        <Card>
            <div className="flex items-center mb-1"><TrendingUp className="w-6 h-6 mr-3 text-blue-600" /><h2 className="text-xl font-bold text-gray-800">Market Balance Volatility</h2></div>
            <p className="text-sm text-gray-500 mb-4">30-day rolling volatility of the supply/consumption balance.</p>
            <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(tick) => tick.toFixed(0)} />
                        <Tooltip formatter={(value) => `${value.toFixed(1)} TJ`} />
                        <RechartsArea type="monotone" dataKey="volatility" name="30D Volatility" stroke={VOLATILITY_COLOR} fill={VOLATILITY_COLOR} fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// --- UI & LAYOUT COMPONENTS ---
function FacilityControls({ facilityInfo, activeFacilities, setActiveFacilities }) {
    const [isOpen, setIsOpen] = useState(false);
    const productionFacilities = Object.keys(facilityInfo).filter(f => facilityInfo[f].type === 'Production');
    return (
        <div className="relative"><button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-md text-lg font-semibold text-gray-700"><div className="flex items-center"><Settings className="w-6 h-6 mr-3 text-blue-600" /><span>Manage Production Facilities</span></div>{isOpen ? <ChevronUp /> : <ChevronDown />}</button>
            {isOpen && <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 z-10"><p className="text-sm text-gray-600 mb-4">Select production facilities to include in the supply stack.</p><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{productionFacilities.map(facility => <label key={facility} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><input type="checkbox" checked={!!activeFacilities[facility]} onChange={() => setActiveFacilities(p => ({ ...p, [facility]: !p[facility] }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><span className="text-sm text-gray-800">{facility}</span></label>)}</div></div>}
        </div>
    );
}

function SummaryTiles({ data, storageData, volatility }) {
    if (!data || data.length === 0) return null;
    const latestActualData = data[data.length - 1];
    const balance = latestActualData ? latestActualData.totalSupply - latestActualData.totalDemand : 0;
    const latestStorageFlow = storageData.length > 0 ? storageData[storageData.length - 1].netFlow : 0;
    const latestVolatility = volatility.length > 0 ? volatility[volatility.length - 1].volatility : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="text-center"><h3 className="text-sm font-medium text-gray-500">Prod/Cons Balance</h3><p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{balance >= 0 ? '+' : ''}{balance.toFixed(0)}</p><p className="text-xs text-gray-400">TJ/day (D-7)</p></Card>
            <Card className="text-center"><h3 className="text-sm font-medium text-gray-500">Net Storage Flow</h3><div className="flex items-center justify-center space-x-2"><p className={`text-3xl font-bold ${latestStorageFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>{latestStorageFlow.toFixed(0)}</p><p className={`text-lg font-semibold ${latestStorageFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>{latestStorageFlow >= 0 ? 'Inject' : 'Withdraw'}</p></div><p className="text-xs text-gray-400">TJ/day (D-2)</p></Card>
            <Card className="text-center"><h3 className="text-sm font-medium text-gray-500">Balance Volatility</h3><p className="text-3xl font-bold text-gray-700">{latestVolatility.toFixed(1)}</p><p className="text-xs text-gray-400">30-Day Std. Dev.</p></Card>
        </div>
    );
}

function ScenarioPlanner({ facilities, scenario, setScenario, onApply }) {
    const [localScenario, setLocalScenario] = useState(scenario);
    const productionFacilities = Object.keys(facilities).filter(f => facilities[f].type === 'Production');

    useEffect(() => { setLocalScenario(scenario); }, [scenario]);

    const handleApply = () => { onApply(localScenario); };
    const handleReset = () => { onApply({ active: false, facility: null, outagePercent: 100, startDate: '', endDate: '' }); };

    return (
        <Card>
            <div className="flex items-center mb-4"><Zap className="w-6 h-6 mr-3 text-amber-500" /><h2 className="text-xl font-bold text-gray-800">Outage Scenario Planner</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="facility" className="block text-sm font-medium text-gray-700">Facility</label>
                    <select id="facility" value={localScenario.facility || ''} onChange={e => setLocalScenario(s => ({ ...s, facility: e.target.value, active: true }))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Select Facility...</option>
                        {productionFacilities.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="outage" className="block text-sm font-medium text-gray-700">Outage %</label>
                    <input type="number" id="outage" value={localScenario.outagePercent} onChange={e => setLocalScenario(s => ({ ...s, outagePercent: parseInt(e.target.value), active: true }))} className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 rounded-md" />
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleApply} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Apply</button>
                    <button onClick={handleReset} className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Reset</button>
                </div>
            </div>
        </Card>
    );
}

// --- PAGE COMPONENTS ---
function DashboardPage({ liveData, activeFacilities, setActiveFacilities, scenario, setScenario, navigateTo }) {
    return (
        <div className="space-y-6">
            <SummaryTiles data={liveData.processedFlows} storageData={liveData.storageAnalysis} volatility={liveData.volatility} />
            <ScenarioPlanner facilities={liveData.facilityInfo} scenario={scenario} setScenario={setScenario} onApply={setScenario} />
            <FacilityControls facilityInfo={liveData.facilityInfo} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} />
            <SupplyDemandChart data={liveData.processedFlows} facilityInfo={liveData.facilityInfo} scenario={scenario} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StorageAnalysisChart data={liveData.storageAnalysis} totalCapacity={liveData.totalStorageCapacity} />
                <FacilityConsumptionChart data={liveData.facilityConsumption} />
            </div>
            <VolatilityChart data={liveData.volatility} />
            <div className="grid grid-cols-1"><Card className="flex flex-col items-center justify-center text-center"><h2 className="text-xl font-bold text-gray-800">Yara Pilbara Impact</h2><p className="text-sm text-gray-600 my-2">Model the market impact of changes in Yara's gas consumption.</p><button onClick={() => navigateTo('yara')} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">Open Scenario Planner</button></Card></div>
        </div>
    );
}

function YaraPage({ yaraAdjustment, setYaraAdjustment, navigateTo }) {
    const [localAdjustment, setLocalAdjustment] = useState(yaraAdjustment);
    const handleApply = () => { setYaraAdjustment(localAdjustment); navigateTo('dashboard'); };
    return (
        <div><PageTitle backAction={() => navigateTo('dashboard')}>Yara Pilbara Scenario Planner</PageTitle><Card className="flex flex-col justify-center max-w-md mx-auto"><h2 className="text-xl font-bold text-gray-800 text-center mb-4">Adjust Market Consumption</h2><p className="text-sm text-gray-600 text-center mb-6">Increase or reduce Yara's assumed consumption to see its effect on the overall WA gas market balance. This adjustment will be applied to the total consumption data.</p><div className="flex items-center justify-center space-x-4 mb-4"><button onClick={() => setLocalAdjustment(v => v - 10)} className="w-12 h-12 rounded-full bg-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-300">-</button><div className="text-center"><p className={`text-4xl font-bold ${localAdjustment > 0 ? 'text-red-500' : localAdjustment < 0 ? 'text-green-500' : 'text-gray-800'}`}>{localAdjustment >= 0 ? '+' : ''}{localAdjustment}</p><p className="text-sm text-gray-500">TJ/day</p></div><button onClick={() => setLocalAdjustment(v => v + 10)} className="w-12 h-12 rounded-full bg-gray-200 text-2xl font-bold text-gray-700 hover:bg-gray-300">+</button></div><p className="text-xs text-center text-gray-500 mb-6">This value will be added to the total market consumption.</p><button onClick={handleApply} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Apply Scenario & View Dashboard</button></Card></div>
    );
}

// --- MAIN APP COMPONENT ---
export default function App() {
    const [page, setPage] = useState('dashboard');
    const [yaraAdjustment, setYaraAdjustment] = useState(0);
    const [activeFacilities, setActiveFacilities] = useState({});
    const [scenario, setScenario] = useState({ active: false, facility: null, outagePercent: 100 });
    const [liveData, setLiveData] = useState({ processedFlows: [], facilityInfo: {}, storageAnalysis: [], totalStorageCapacity: 0, facilityConsumption: [], volatility: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            setLoading(true); setError(null);
            try {
                // 1. Fetch static and semi-static data
                const [capacityRes, mtcRes] = await Promise.all([
                    fetch(`${AEMO_API_BASE_URL}/capacityOutlook/current`),
                    fetch(`${AEMO_API_BASE_URL}/mediumTermCapacity/current`),
                ]);
                if (!capacityRes.ok) throw new Error(`Failed to fetch Capacity Outlook: ${capacityRes.statusText}`);
                if (!mtcRes.ok) throw new Error(`Failed to fetch Medium Term Capacity: ${mtcRes.statusText}`);
                
                const capacityData = await capacityRes.json();
                const mtcData = await mtcRes.json();

                const facilityInfo = {};
                const colors = ["#06b6d4", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#d946ef", "#6b7280"];
                let colorIndex = 0;
                capacityData.rows.forEach(row => {
                    if (!facilityInfo[row.facilityName]) {
                        let type = 'Pipeline';
                        if (row.capacityType.includes('Production')) type = 'Production';
                        if (row.capacityType.includes('Storage')) type = 'Storage';
                        facilityInfo[row.facilityName] = { type, color: colors[colorIndex++ % colors.length] };
                    }
                });
                const totalStorageCapacity = mtcData.rows.reduce((acc, row) => (facilityInfo[row.facilityName]?.type === 'Storage' && row.capacityType === 'Nameplate') ? acc + row.capacity : acc, 0);

                // 2. Fetch historical data in monthly batches
                const today = new Date();
                const monthPromises = [];
                for (let i = 0; i < 24; i++) {
                    const date = new Date(today);
                    date.setMonth(today.getMonth() - i);
                    const monthString = getYYYYMMString(date);
                    monthPromises.push(fetch(`${AEMO_API_BASE_URL}/actualFlow/${monthString}.csv`));
                    monthPromises.push(fetch(`${AEMO_API_BASE_URL}/largeUserConsumption/${monthString}.csv`));
                }
                
                const responses = await Promise.all(monthPromises);
                const csvTexts = await Promise.all(responses.map(res => res.ok ? res.text() : ''));
                
                // 3. Process data
                const dailyData = {};
                const facilityConsumptionData = [];
                const storageFlows = {};

                csvTexts.forEach(csv => {
                    if (!csv) return;
                    const parsed = parseCSV(csv);
                    if (parsed.length === 0) return;

                    if (parsed[0].hasOwnProperty('facilityCode') && parsed[0].hasOwnProperty('receipt')) { // Flow data
                        parsed.forEach(row => {
                            const date = row.gasDay;
                            if (!date) return;
                            if (!dailyData[date]) dailyData[date] = { date: new Date(date).toLocaleDateString('en-CA'), timestamp: new Date(date).getTime(), totalDemand: 0, totalSupply: 0 };
                            if (!storageFlows[date]) storageFlows[date] = { netFlow: 0 };
                            
                            const info = facilityInfo[row.facilityName];
                            if (info?.type === 'Production') {
                                const supply = parseFloat(row.receipt) || 0;
                                dailyData[date][row.facilityName] = (dailyData[date][row.facilityName] || 0) + supply;
                                dailyData[date].totalSupply += supply;
                            } else if (info?.type === 'Storage') {
                                storageFlows[date].netFlow += (parseFloat(row.receipt) || 0) - (parseFloat(row.delivery) || 0);
                            }
                        });
                    } else if (parsed[0].hasOwnProperty('facilityCode') && parsed[0].hasOwnProperty('quantity')) { // Demand data
                        parsed.forEach(item => {
                            const date = item.gasDay;
                            if (!date) return;
                            if (!dailyData[date]) dailyData[date] = { date: new Date(date).toLocaleDateString('en-CA'), timestamp: new Date(date).getTime(), totalDemand: 0, totalSupply: 0 };
                            const quantity = parseFloat(item.quantity) || 0;
                            dailyData[date].totalDemand += quantity;
                            facilityConsumptionData.push({ ...item, quantity });
                        });
                    }
                });
                
                let processedFlows = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
                
                // 4. ALIGN DATA: Only include days where we have BOTH supply and demand
                processedFlows = processedFlows.filter(d => d.totalDemand > 0 && d.totalSupply > 0);

                const finalFlows = processedFlows.map(d => ({...d, totalDemand: d.totalDemand + yaraAdjustment }));

                // 5. Calculate Storage and Volatility
                const sortedStorageFlows = Object.entries(storageFlows).sort((a,b) => new Date(a[0]) - new Date(b[0]));
                let currentVolume = totalStorageCapacity * 0.5;
                const storageAnalysis = sortedStorageFlows.map(([date, flows]) => {
                    currentVolume = Math.max(0, Math.min(totalStorageCapacity, currentVolume + flows.netFlow));
                    return { date: new Date(date).toLocaleDateString('en-CA'), netFlow: flows.netFlow, totalVolume: currentVolume };
                });

                const balanceData = finalFlows.map(d => ({ date: d.date, balance: d.totalSupply - d.totalDemand }));
                const volatility = [];
                for (let i = 29; i < balanceData.length; i++) {
                    const slice = balanceData.slice(i - 29, i + 1).map(d => d.balance);
                    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
                    const stdDev = Math.sqrt(slice.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / slice.length);
                    volatility.push({ date: balanceData[i].date, volatility: stdDev });
                }

                // 6. Set all state
                setLiveData({ processedFlows: finalFlows, facilityInfo, storageAnalysis, totalStorageCapacity, facilityConsumption: facilityConsumptionData, volatility });
                const initialActive = {};
                Object.keys(facilityInfo).forEach(name => { if (facilityInfo[name].type === 'Production') initialActive[name] = true; });
                setActiveFacilities(initialActive);

            } catch (err) { console.error("API Error:", err); setError(err.message); } 
            finally { setLoading(false); }
        };
        fetchAndProcessData();
    }, [yaraAdjustment]);

    const navigateTo = (targetPage) => setPage(targetPage);
    
    const filteredLiveData = useMemo(() => {
        if (!liveData.processedFlows) return liveData;
        const newFlows = liveData.processedFlows.map(day => {
            const newDay = { ...day, totalSupply: 0, simulatedSupply: 0 };
            let scenarioImpact = 0;
            Object.keys(activeFacilities).forEach(facilityName => {
                const baseSupply = day[facilityName] || 0;
                if (activeFacilities[facilityName]) newDay.totalSupply += baseSupply;
                if (scenario.active && facilityName === scenario.facility) {
                    scenarioImpact = baseSupply * (scenario.outagePercent / 100);
                }
            });
            newDay.simulatedSupply = newDay.totalSupply - scenarioImpact;
            return newDay;
        });
        return {...liveData, processedFlows: newFlows };
    }, [liveData, activeFacilities, scenario]);

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1><p className="text-sm text-gray-500">Live Data from AEMO, with Trader Analytics</p></div></header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {!loading && !error && page === 'dashboard' && <DashboardPage liveData={filteredLiveData} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} scenario={scenario} setScenario={setScenario} navigateTo={navigateTo} />}
                {!loading && !error && page === 'yara' && <YaraPage yaraAdjustment={yaraAdjustment} setYaraAdjustment={setYaraAdjustment} navigateTo={navigateTo} />}
            </main>
            <footer className="text-center py-4"><p className="text-xs text-gray-500">Dashboard data sourced from AEMO GBB API. Last updated: {new Date().toLocaleString()}.</p></footer>
        </div>
    )
}
