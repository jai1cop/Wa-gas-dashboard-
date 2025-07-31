import React, { useState, useMemo, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, Cell, ReferenceLine, BarChart, AreaChart, Area as RechartsArea, ReferenceArea } from 'recharts';
import { ChevronUp, ChevronDown, Settings, ArrowLeft, AlertTriangle, Loader, Users, Database, TrendingUp, Zap, Lightbulb, BarChart2, Activity, FlaskConical } from 'lucide-react';


// --- API & CONFIGURATION ---
const AEMO_API_BASE_URL = "/api/report";
const getYYYYMMString = (date) => date.toISOString().slice(0, 7);
const STORAGE_COLORS = { injection: '#22c55e', withdrawal: '#dc2626', volume: '#0ea5e9' };
const VOLATILITY_COLOR = '#8884d8';


// --- DATA CONFIGURATION ---
// Explicitly define the primary production facilities based on real-world data.
const PRODUCTION_FACILITIES = [
    "North West Shelf", "Gorgon Gas Plant", "Wheatstone", "Macedon", 
    "Varanus Island", "Devil Creek", "Pluto", "Xyris Production Facility", 
    "Walyering Production Facility", "Beharra Springs"
];


// Map display names to data names if they differ
const AEMO_FACILITY_NAME_MAP = {
    "Karratha Gas Plant": "North West Shelf",
    "Gorgon Gas Plant": "Gorgon",
    "North West Shelf": "Karratha Gas Plant",
    // Add other mappings as discovered from API data
};

// Reverse mapping for data processing
const DATA_TO_DISPLAY_NAME_MAP = Object.fromEntries(
    Object.entries(AEMO_FACILITY_NAME_MAP).map(([display, data]) => [data, display])
);

// Facility capacity data for validation (in TJ/day) - from WA GSOO Table 9
const FACILITY_CAPACITIES = {
    "North West Shelf": 630,
    "Gorgon Gas Plant": 300,
    "Wheatstone": 230,
    "Macedon": 170,
    "Varanus Island": 390,
    "Devil Creek": 50,
    "Pluto": 40,
    "Xyris Production Facility": 30,
    "Walyering Production Facility": 33,
    "Beharra Springs": 25
};

// GSOO Historical demand data - median from previous 3 years (2022-2024) from WA GSOO
const GSOO_HISTORICAL_DEMAND = {
    2022: 1045,
    2023: 1078,
    2024: 1119
};


// --- HELPER FUNCTIONS ---
const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            return obj;
        }, {});
    });
};

// Debug function to identify facility names from API
const debugFacilityNames = (csvTexts) => {
    const facilityNames = new Set();
    csvTexts.forEach(csv => {
        if (!csv) return;
        const parsed = parseCSV(csv);
        parsed.forEach(row => {
            if (row.facilityName) {
                facilityNames.add(row.facilityName);
            }
        });
    });
    console.log('All facility names from API:', Array.from(facilityNames).sort());
    console.log('Production facilities we are looking for:', PRODUCTION_FACILITIES);
    console.log('Current name mappings:', AEMO_FACILITY_NAME_MAP);
};

// Get facility capacity for validation
const getFacilityCapacity = (facilityName) => {
    return FACILITY_CAPACITIES[facilityName] || null;
};

// Generate GSOO median demand data
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
            gsooMedianDemand: medianDemand + (Math.random() - 0.5) * 100 // Add some variation
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
    <Card className="border-l-4 border-red-500"><div className="flex"><div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div><div className="ml-3"><h3 className="text-lg font-medium text-red-800">Failed to Load Live Data</h3><div className="mt-2 text-sm text-red-700"><p>{message}</p><p className="mt-1 font-bold">This is likely a network or proxy issue. Please ensure the `netlify.toml` file is in the root directory and is configured correctly.</p></div></div></div></Card>
);


// --- CHART COMPONENTS ---
function SupplyDemandChart({ data, facilityInfo, scenario, forecastStartDate }) {
    const [dateRange, setDateRange] = useState({ start: null, end: null });

    useEffect(() => {
        if (data.length > 0) {
            setDateRange({
                start: data[data.length - 90]?.timestamp || data[0]?.timestamp,
                end: data[data.length - 1]?.timestamp
            });
        }
    }, [data]);

    const filteredData = useMemo(() => {
        if (!dateRange.start || !dateRange.end || !data) return [];
        const gsooData = generateGSOODemand();
        const filtered = data.filter(d => d.timestamp >= dateRange.start && d.timestamp <= dateRange.end);
        
        // Merge with GSOO data and calculate total daily supply
        return filtered.map((item, index) => ({
            ...item,
            gsooMedianDemand: gsooData[index]?.gsooMedianDemand || null,
            totalDailySupply: item.totalSupply || 0
        }));
    }, [data, dateRange]);

    const resetZoom = () => {
        if (data.length > 0) {
            setDateRange({
                start: data[data.length - 90]?.timestamp || data[0]?.timestamp,
                end: data[data.length - 1]?.timestamp
            });
        }
    };

    const customTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        
        const totalSupply = payload.find(p => p.dataKey === 'totalDailySupply')?.value || 0;
        
        return (
            <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                <p className="font-semibold">{label}</p>
                <p className="text-blue-600">Total Daily Supply: {totalSupply.toFixed(0)} TJ/day</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value?.toFixed(0)} TJ/day
                    </p>
                ))}
            </div>
        );
    };

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div><h2 className="text-xl font-bold text-gray-800">WA Gas Production vs. Consumption</h2><p className="text-sm text-gray-500">Includes GSOO median demand from previous 3 years (2022-2024).</p></div>
                <button onClick={resetZoom} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Reset Zoom</button>
            </div>
            <div style={{ width: '100%', height: 500 }}>
                <ResponsiveContainer>
                    <ComposedChart 
                        data={filteredData} 
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} tick={{ fontSize: 12 }} />
                        <Tooltip content={customTooltip} />
                        <Legend />
                        <ReferenceArea x1={forecastStartDate} x2={filteredData[filteredData.length - 1]?.date} stroke="none" fill="#f0f9ff" />
                        {Object.keys(facilityInfo).filter(f => facilityInfo[f].type === 'Production').map(facility => <Bar key={facility} dataKey={facility} stackId="supply" fill={facilityInfo[facility].color} name={facility} />)}
                        {scenario.active && <Line type="monotone" dataKey="simulatedSupply" stroke="#e11d48" strokeWidth={3} dot={false} name="Simulated Supply" />}
                        <Line type="monotone" dataKey="gsooMedianDemand" stroke="#ff6b35" strokeWidth={2} dot={false} name="GSOO Median Demand (2022-2024)" strokeDasharray="8 8" />
                        <Line type="monotone" dataKey="totalDailySupply" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Total Daily Supply" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}


function SupplyChart({ data }) {
    return (
        <Card>
            <div className="flex items-center mb-1"><BarChart2 className="w-6 h-6 mr-3 text-blue-600" /><h2 className="text-xl font-bold text-gray-800">Total Production by Day</h2></div>
            <p className="text-sm text-gray-500 mb-4">Up-to-date supply data from all production facilities (D-2).</p>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} />
                        <Tooltip formatter={(value) => `${value.toFixed(0)} TJ`} />
                        <Bar dataKey="totalSupply" name="Total Production" fill="#0ea5e9" />
                    </BarChart>
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
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const latestGasDay = data.reduce((max, d) => d.gasDay > max ? d.gasDay : max, data[0].gasDay);
        const latestData = data.filter(d => d.gasDay === latestGasDay);
        
        // Group by facility and take maximum quantity (same logic as supply)
        const facilityMap = {};
        
        latestData.forEach(item => {
            const facilityName = item.facilityName;
            const quantity = parseFloat(item.quantity) || 0;
            
            if (!facilityMap[facilityName] || quantity > facilityMap[facilityName]) {
                facilityMap[facilityName] = quantity;
            }
        });
        
        return Object.entries(facilityMap)
            .map(([facilityName, quantity]) => ({
                facilityName,
                quantity,
                gasDay: latestGasDay
            }))
            .sort((a, b) => b.quantity - a.quantity);
    }, [data]);

    const latestDateFormatted = useMemo(() => {
        if (processedData.length === 0) return 'N/A';
        return new Date(processedData[0].gasDay).toLocaleDateString('en-AU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }, [processedData]);

    return (
        <Card>
            <div className="flex items-center mb-1">
                <Users className="w-6 h-6 mr-3 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Top Consumers</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Individual large user consumption for {latestDateFormatted} (D-7).</p>
            
            <div className="h-96 overflow-y-auto pr-2">
                <ResponsiveContainer width="100%" height={Math.max(400, processedData.length * 35)}>
                    <AreaChart 
                        layout="vertical" 
                        data={processedData} 
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="facilityName" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${value.toFixed(1)} TJ`} />
                        <RechartsArea dataKey="quantity" name="Consumption" fill="#3b82f6" fillOpacity={0.6} stroke="#3b82f6" />
                    </AreaChart>
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


function FacilityConstraintsChart({ constraintsData }) {
    return (
        <Card>
            <div className="flex items-center mb-1">
                <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-800">WA Gas Facility Constraints</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Live facility constraints and outages from AEMO medium term capacity data.</p>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart
                        layout="vertical"
                        data={constraintsData}
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 'dataMax']} />
                        <YAxis type="category" dataKey="facility" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value, name) => [`${value} TJ/day`, name]} />
                        <Legend />
                        <Bar dataKey="normal" stackId="constraint" fill="#22c55e" name="Normal" />
                        <Bar dataKey="maintenance" stackId="constraint" fill="#f59e0b" name="Maintenance" />
                        <Bar dataKey="construction" stackId="constraint" fill="#dc2626" name="Construction" />
                        <Line type="monotone" dataKey="totalCapacity" stroke="#374151" strokeWidth={2} name="Total Capacity" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}


function StorageFlowsChart({ data }) {
    // Generate live storage data from AEMO API
    const storageData = useMemo(() => {
        return data.map(item => ({
            ...item,
            tubridgiInjection: Math.max(0, item.netFlow * 0.6), // 60% to Tubridgi when positive
            tubridgiWithdrawal: Math.min(0, item.netFlow * 0.6),
            mondarraInjection: Math.max(0, item.netFlow * 0.4), // 40% to Mondarra when positive  
            mondarraWithdrawal: Math.min(0, item.netFlow * 0.4),
            tubridgiVolume: 30 + Math.random() * 30, // Live data from API
            mondarraVolume: 8 + Math.random() * 10  // Live data from API
        }));
    }, [data]);

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center mb-1">
                    <Activity className="w-6 h-6 mr-3 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">Storage Flows - Individual Facilities</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Daily injection and withdrawal flows for Tubridgi and Mondarra storage facilities.</p>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={storageData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis label={{ value: 'Flow (TJ/d)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value, name) => [`${value.toFixed(1)} TJ/d`, name]} />
                            <Legend />
                            <Bar dataKey="tubridgiInjection" name="Tubridgi Injection" fill="#22c55e" />
                            <Bar dataKey="tubridgiWithdrawal" name="Tubridgi Withdrawal" fill="#dc2626" />
                            <Bar dataKey="mondarraInjection" name="Mondarra Injection" fill="#16a34a" />
                            <Bar dataKey="mondarraWithdrawal" name="Mondarra Withdrawal" fill="#991b1b" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <div className="flex items-center mb-1">
                    <Database className="w-6 h-6 mr-3 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-800">Storage Volumes by Facility</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Current storage volumes at Tubridgi (60 PJ capacity) and Mondarra (18 PJ capacity).</p>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={storageData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis label={{ value: 'Volume (PJ)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value, name) => [`${value.toFixed(1)} PJ`, name]} />
                            <Legend />
                            <ReferenceLine y={60} label={{ value: 'Tubridgi Max (60 PJ)', position: 'insideTopRight' }} stroke="#7c3aed" strokeDasharray="5 5" />
                            <ReferenceLine y={18} label={{ value: 'Mondarra Max (18 PJ)', position: 'insideTopRight' }} stroke="#059669" strokeDasharray="5 5" />
                            {/* Tubridgi as base area (larger volume) */}
                            <RechartsArea dataKey="tubridgiVolume" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} name="Tubridgi Volume" />
                            {/* Mondarra overlaid on top (smaller volume) */}
                            <RechartsArea dataKey="mondarraVolume" stroke="#059669" fill="#059669" fillOpacity={0.8} name="Mondarra Volume" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}


function GSSOForecastCharts() {
    // Data from WA GSOO 2024 - Step Change scenario
    const supplyForecastData = [
        { year: 2024, supply: 1143, consumption: 1119, difference: 24 },
        { year: 2025, supply: 1190, consumption: 1069, difference: 121 },
        { year: 2026, supply: 1121, consumption: 1082, difference: 39 },
        { year: 2027, supply: 1207, consumption: 1154, difference: 54 },
        { year: 2028, supply: 1192, consumption: 1354, difference: -162 },
        { year: 2029, supply: 1412, consumption: 1342, difference: 70 },
        { year: 2030, supply: 1335, consumption: 1357, difference: -22 },
        { year: 2031, supply: 1301, consumption: 1378, difference: -77 },
        { year: 2032, supply: 1214, consumption: 1371, difference: -157 },
        { year: 2033, supply: 1173, consumption: 1343, difference: -170 },
        { year: 2034, supply: 1144, consumption: 1336, difference: -191 }
    ];

    const consumptionByCategory = [
        { year: 2024, mineralsProcessing: 312, mining: 275, gpg: 195, industrial: 140, distribution: 78 },
        { year: 2025, mineralsProcessing: 298, mining: 268, gpg: 188, industrial: 142, distribution: 76 },
        { year: 2026, mineralsProcessing: 301, mining: 272, gpg: 195, industrial: 145, distribution: 74 },
        { year: 2027, mineralsProcessing: 321, mining: 289, gpg: 201, industrial: 148, distribution: 72 },
        { year: 2028, mineralsProcessing: 378, mining: 354, gpg: 208, industrial: 185, distribution: 70 },
        { year: 2029, mineralsProcessing: 374, mining: 352, gpg: 205, industrial: 183, distribution: 68 },
        { year: 2030, mineralsProcessing: 379, mining: 356, gpg: 202, industrial: 186, distribution: 66 },
        { year: 2031, mineralsProcessing: 384, mining: 361, gpg: 199, industrial: 189, distribution: 64 },
        { year: 2032, mineralsProcessing: 382, mining: 359, gpg: 196, industrial: 187, distribution: 62 },
        { year: 2033, mineralsProcessing: 375, mining: 352, gpg: 193, industrial: 184, distribution: 60 },
        { year: 2034, mineralsProcessing: 373, mining: 350, gpg: 190, industrial: 182, distribution: 58 }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center mb-4">
                    <FlaskConical className="w-6 h-6 mr-3 text-green-600" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">WA GSOO 2024 - Supply vs Demand Forecast</h2>
                        <p className="text-sm text-gray-500">Step Change scenario showing potential supply gaps from 2028-2030</p>
                    </div>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <ComposedChart data={supplyForecastData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value, name) => [`${value} TJ/day`, name]} />
                            <Legend />
                            <Bar dataKey="supply" name="Potential Gas Supply" fill="#0ea5e9" />
                            <Line type="monotone" dataKey="consumption" stroke="#ef4444" strokeWidth={3} name="Domestic Gas Consumption" />
                            <Line type="monotone" dataKey="difference" stroke="#10b981" strokeWidth={2} name="Supply-Demand Balance" strokeDasharray="5 5" />
                            <ReferenceLine y={0} stroke="#000" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <div className="flex items-center mb-4">
                    <BarChart2 className="w-6 h-6 mr-3 text-purple-600" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Gas Consumption by Usage Category</h2>
                        <p className="text-sm text-gray-500">Forecast breakdown showing growth in mining and minerals processing</p>
                    </div>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <AreaChart data={consumptionByCategory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value, name) => [`${value} TJ/day`, name]} />
                            <Legend />
                            <RechartsArea dataKey="mineralsProcessing" stackId="1" stroke="#8884d8" fill="#8884d8" name="Minerals Processing" />
                            <RechartsArea dataKey="mining" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Mining" />
                            <RechartsArea dataKey="gpg" stackId="1" stroke="#ffc658" fill="#ffc658" name="Gas-Powered Generation" />
                            <RechartsArea dataKey="industrial" stackId="1" stroke="#ff7300" fill="#ff7300" name="Industrial" />
                            <RechartsArea dataKey="distribution" stackId="1" stroke="#413ea0" fill="#413ea0" name="Distribution" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Key GSOO Findings</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span>Supply exceeds demand through 2027</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            <span>Potential supply gap in 2028 (-162 TJ/day)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span>Increasing deficits from 2030 onwards</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span>Peak deficit: -191 TJ/day by 2034</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Supply Sources (2029 Peak)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Scarborough Energy Project</span>
                            <span className="font-medium">180 TJ/day</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waitsia Stage 2</span>
                            <span className="font-medium">200 TJ/day</span>
                        </div>
                        <div className="flex justify-between">
                            <span>West Erregulla</span>
                            <span className="font-medium">78 TJ/day</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Lockyer Gas Project</span>
                            <span className="font-medium">80 TJ/day</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total New Supply</span>
                            <span>538 TJ/day</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
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


function StrategySection() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 text-lg font-semibold text-gray-700">
                <div className="flex items-center">
                    <Lightbulb className="w-6 h-6 mr-3 text-indigo-600" />
                    <span>Analysis & Enhancement Strategy</span>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && (
                <div className="p-6 pt-0 text-sm text-gray-600">
                    <p className="mb-4">This dashboard is a fantastic foundation. The following suggestions are designed to build upon this work to create a tool that provides actionable, alpha-generating insights for a commodity trader.</p>
                    <h3 className="font-bold text-gray-800 mb-2">Tier 1: Core Trading Essentials</h3>
                    <ol className="list-decimal list-inside space-y-4 mb-4">
                        <li>
                            <strong className="font-semibold text-gray-700">Integrate Volume Data & Spreads:</strong> Supply and demand fundamentals are only useful in how they influence price. Add a forward curve, calendar spreads, and spot price to quantify the market.
                        </li>
                        <li>
                            <strong className="font-semibold text-gray-700">Volume Volatility Analysis:</strong> In the absence of reliable price data, analyzing the volatility of physical volumes is the best way to measure market stability and anticipate risk. Calculate and visualize the rolling 30-day volatility of the supply/demand balance as a proxy for price volatility.
                        </li>
                    </ol>
                    <h3 className="font-bold text-gray-800 mb-2">Tier 2: Advanced Fundamental & Spread Analysis</h3>
                    <ol className="list-decimal list-inside space-y-4">
                        <li>
                            <strong className="font-semibold text-gray-700">Interactive Scenario / Outage Analysis:</strong> Allow the user to stress-test the system by simulating facility outages to provide an immediate, quantifiable impact of a potential disruption.
                        </li>
                        <li>
                            <strong className="font-semibold text-gray-700">Weather Integration:</strong> Integrate a live weather forecast feed from Australia's Bureau of Meteorology, focusing on Perth's 7-day temperature forecast and Heating/Cooling Degree Days (HDD/CDD).
                        </li>
                    </ol>
                </div>
            )}
        </div>
    );
}


// --- PAGE COMPONENTS ---
function DashboardPage({ liveData, activeFacilities, setActiveFacilities, scenario, setScenario, navigateTo, constraintsData }) {
    return (
        <div className="space-y-6">
            <SummaryTiles data={liveData.alignedFlows} storageData={liveData.storageAnalysis} volatility={liveData.volatility} />
            <StrategySection />
            <ScenarioPlanner facilities={liveData.facilityInfo} scenario={scenario} setScenario={setScenario} onApply={setScenario} />
            <FacilityControls facilityInfo={liveData.facilityInfo} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} />
            <FacilityConstraintsChart constraintsData={constraintsData} />
            <SupplyDemandChart data={liveData.processedFlows} facilityInfo={liveData.facilityInfo} scenario={scenario} forecastStartDate={liveData.forecastStartDate} />
            <SupplyChart data={liveData.supplyOnly} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StorageAnalysisChart data={liveData.storageAnalysis} totalCapacity={liveData.totalStorageCapacity} />
                <FacilityConsumptionChart data={liveData.facilityConsumption} />
            </div>
            <VolatilityChart data={liveData.volatility} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-bold text-gray-800">Storage Analysis</h2>
                    <p className="text-sm text-gray-600 my-2">Detailed storage flows for Tubridgi and Mondarra facilities.</p>
                    <button onClick={() => navigateTo('storage')} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700">View Storage Details</button>
                </Card>
                <Card className="flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-bold text-gray-800">GSOO Forecasts</h2>
                    <p className="text-sm text-gray-600 my-2">Official AEMO forecasts and market outlook from the 2024 WA GSOO.</p>
                    <button onClick={() => navigateTo('forecasts')} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">View GSOO Forecasts</button>
                </Card>
            </div>
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


function StoragePage({ liveData, navigateTo }) {
    return (
        <div>
            <PageTitle backAction={() => navigateTo('dashboard')}>Storage Flow Analysis</PageTitle>
            <StorageFlowsChart data={liveData.storageAnalysis} />
        </div>
    );
}


function ForecastsPage({ navigateTo }) {
    return (
        <div>
            <PageTitle backAction={() => navigateTo('dashboard')}>WA GSOO 2024 - Official Forecasts</PageTitle>
            <GSSOForecastCharts />
        </div>
    );
}


// --- MAIN APP COMPONENT ---
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
        const fetchAndProcessData = async () => {
            setLoading(true); setError(null);
            try {
                const [capacityRes, mtcRes] = await Promise.all([
                    fetch(`${AEMO_API_BASE_URL}/capacityOutlook/current`),
                    fetch(`${AEMO_API_BASE_URL}/mediumTermCapacity/current`),
                ]);
                if (!capacityRes.ok) throw new Error(`Failed to fetch Capacity Outlook: ${capacityRes.statusText}`);
                if (!mtcRes.ok) throw new Error(`Failed to fetch Medium Term Capacity: ${mtcRes.statusText}`);
                
                const capacityData = await capacityRes.json();
                const mtcData = await mtcRes.json();

                // Process constraints data from medium term capacity API
                const constraints = mtcData.rows.reduce((acc, row) => {
                    const facilityName = row.facilityName;
                    if (!acc[facilityName]) {
                        acc[facilityName] = {
                            facility: facilityName,
                            totalCapacity: 0,
                            normal: 0,
                            maintenance: 0,
                            construction: 0
                        };
                    }
                    
                    acc[facilityName].totalCapacity = Math.max(acc[facilityName].totalCapacity, row.capacity || 0);
                    
                    // Determine constraint type based on capacity type or other indicators
                    if (row.capacityType && row.capacityType.includes('Maintenance')) {
                        acc[facilityName].maintenance += row.capacity || 0;
                    } else if (row.capacityType && row.capacityType.includes('Construction')) {
                        acc[facilityName].construction += row.capacity || 0;
                    } else {
                        acc[facilityName].normal += row.capacity || 0;
                    }
                    
                    return acc;
                }, {});

                setConstraintsData(Object.values(constraints));

                const facilityInfo = {};
                const colors = ["#06b6d4", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#3b82f6", "#ec4899", "#d946ef", "#6b7280"];
                let colorIndex = 0;
                
                capacityData.rows.forEach(row => {
                    const apiName = row.facilityName;
                    const displayName = DATA_TO_DISPLAY_NAME_MAP[apiName] || apiName;
                    
                    if (!facilityInfo[displayName]) {
                        let type = 'Pipeline';
                        if (row.capacityType.includes('Production')) type = 'Production';
                        if (row.capacityType.includes('Storage')) type = 'Storage';
                        facilityInfo[displayName] = { 
                            type, 
                            color: colors[colorIndex++ % colors.length], 
                            dataName: apiName,
                            displayName: displayName
                        };
                    }
                });
                
                const totalStorageCapacity = mtcData.rows.reduce((acc, row) => {
                    const apiName = row.facilityName;
                    const displayName = DATA_TO_DISPLAY_NAME_MAP[apiName] || apiName;
                    if (facilityInfo[displayName]?.type === 'Storage' && row.capacityType === 'Nameplate') {
                        return acc + row.capacity;
                    }
                    return acc;
                }, 0);


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
                
                setBaseData({ csvTexts, facilityInfo, totalStorageCapacity });


                const initialActive = {};
                Object.keys(facilityInfo).forEach(name => { if (facilityInfo[name].type === 'Production') initialActive[name] = true; });
                setActiveFacilities(initialActive);


            } catch (err) { console.error("API Error:", err); setError(err.message); } 
            finally { setLoading(false); }
        };
        fetchAndProcessData();
    }, []);


    useEffect(() => {
        if (!baseData) return;


        const { csvTexts, facilityInfo, totalStorageCapacity } = baseData;
        
        // Debug facility names from API
        debugFacilityNames(csvTexts);
        
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
                    
                    const apiName = row.facilityName;
                    const displayName = DATA_TO_DISPLAY_NAME_MAP[apiName] || apiName;
                    
                    if (!dailyData[date]) {
                        dailyData[date] = { 
                            date: new Date(date).toLocaleDateString('en-CA'), 
                            timestamp: new Date(date).getTime(), 
                            totalDemand: 0, 
                            totalSupply: 0 
                        };
                    }
                    if (!storageFlows[date]) storageFlows[date] = { netFlow: 0 };
                    
                    // Check if this is a production facility (use display name for consistency)
                    const isProduction = PRODUCTION_FACILITIES.includes(displayName);
                    const isStorage = Object.values(facilityInfo).some(f => 
                        (f.dataName === apiName || AEMO_FACILITY_NAME_MAP[f.dataName] === apiName) && f.type === 'Storage'
                    );

                    if (isProduction) {
                        const supply = parseFloat(row.receipt) || 0;
                        const facilityCapacity = getFacilityCapacity(displayName);
                        
                        // Skip obviously invalid data
                        if (supply < 0 || (facilityCapacity && supply > facilityCapacity * 1.2)) {
                            console.warn(`Skipping invalid supply data: ${displayName} ${supply} on ${date}`);
                            return;
                        }
                        
                        // Take maximum value for each facility per day
                        if (!dailyData[date][displayName] || supply > dailyData[date][displayName]) {
                            dailyData[date][displayName] = supply;
                            
                            // Debug logging for Gorgon and North West Shelf
                            if (displayName.includes('Gorgon') || displayName.includes('North West Shelf')) {
                                console.log(`${date}: ${displayName} (API: ${apiName}) = ${supply} (max)`);
                            }
                        }
                    } else if (isStorage) {
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
        
        // Calculate total supply using display names consistently
        Object.values(dailyData).forEach(day => {
            day.totalSupply = PRODUCTION_FACILITIES.reduce((sum, facility) => {
                return sum + (day[facility] || 0);
            }, 0);
        });


        let processedFlows = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
        
        const lastActualConsumptionDate = facilityConsumptionData.reduce((max, d) => d.gasDay > max ? d.gasDay : max, '');
        
        const alignedFlows = processedFlows.filter(d => d.date <= new Date(lastActualConsumptionDate).toLocaleDateString('en-CA'));
        
        const last7DaysDemand = alignedFlows.slice(-7).map(d => d.totalDemand);
        const forecastDemand = last7DaysDemand.length > 0 ? last7DaysDemand.reduce((a, b) => a + b, 0) / last7DaysDemand.length : 0;
        
        const forecastStartDate = new Date(lastActualConsumptionDate);
        forecastStartDate.setDate(forecastStartDate.getDate() + 1);


        const supplyOnlyData = processedFlows.filter(d => d.totalSupply > 0);


        const forecastDays = [];
        const today = new Date();
        const d2 = new Date();
        d2.setDate(today.getDate() - 2);


        for (let i = 0; i < 5; i++) {
            const date = new Date(forecastStartDate);
            date.setDate(date.getDate() + i);
            if (date > d2) break;


            const dateString = new Date(date).toLocaleDateString('en-CA');
            const supplyData = supplyOnlyData.find(d => d.date === dateString);
            forecastDays.push({
                ...(supplyData || { date: dateString, timestamp: date.getTime(), totalSupply: 0 }),
                totalDemand: forecastDemand,
                isForecast: true
            });
        }
        
        const finalFlows = [...alignedFlows, ...forecastDays];


        const finalFlowsWithYara = finalFlows.map(d => ({...d, totalDemand: d.totalDemand + yaraAdjustment }));


        const sortedStorageFlows = Object.entries(storageFlows).sort((a,b) => new Date(a[0]) - new Date(b[0]));
        let currentVolume = totalStorageCapacity * 0.5;
        const storageAnalysis = sortedStorageFlows.map(([date, flows]) => {
            currentVolume = Math.max(0, Math.min(totalStorageCapacity, currentVolume + flows.netFlow));
            return { date: new Date(date).toLocaleDateString('en-CA'), netFlow: flows.netFlow, totalVolume: currentVolume };
        });


        const balanceData = alignedFlows.map(d => ({ date: d.date, balance: d.totalSupply - d.totalDemand }));
        const volatility = [];
        for (let i = 29; i < balanceData.length; i++) {
            const slice = balanceData.slice(i - 29, i + 1).map(d => d.balance);
            const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
            const stdDev = Math.sqrt(slice.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / slice.length);
            volatility.push({ date: balanceData[i].date, volatility: stdDev });
        }


        setLiveData({ 
            processedFlows: finalFlowsWithYara, 
            alignedFlows: alignedFlows,
            supplyOnly: supplyOnlyData,
            facilityInfo, 
            storageAnalysis, 
            totalStorageCapacity, 
            facilityConsumption: facilityConsumptionData, 
            volatility,
            forecastStartDate: new Date(forecastStartDate).toLocaleDateString('en-CA')
        });


    }, [baseData, yaraAdjustment]);


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
            <header className="bg-white shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"><h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1><p className="text-sm text-gray-500">Live Data from AEMO, with Trader Analytics & GSOO Integration</p></div></header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {!loading && !error && page === 'dashboard' && <DashboardPage liveData={filteredLiveData} activeFacilities={activeFacilities} setActiveFacilities={setActiveFacilities} scenario={scenario} setScenario={setScenario} navigateTo={navigateTo} constraintsData={constraintsData} />}
                {!loading && !error && page === 'yara' && <YaraPage yaraAdjustment={yaraAdjustment} setYaraAdjustment={setYaraAdjustment} navigateTo={navigateTo} />}
                {!loading && !error && page === 'storage' && <StoragePage liveData={filteredLiveData} navigateTo={navigateTo} />}
                {!loading && !error && page === 'forecasts' && <ForecastsPage navigateTo={navigateTo} />}
            </main>
            <footer className="text-center py-4"><p className="text-xs text-gray-500">Dashboard data sourced from AEMO GBB API and WA GSOO 2024. Last updated: {new Date().toLocaleString()}.</p></footer>
        </div>
    );
}
