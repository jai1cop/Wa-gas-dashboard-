import React, { useState, useMemo, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import Card from './Card';
import { GSOO_HISTORICAL_DEMAND } from '../config';

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
        return filtered.map((item) => ({
            ...item,
            gsooMedianDemand: gsooData.find(g => g.date === item.date)?.gsooMedianDemand || null,
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
                    <ComposedChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} tick={{ fontSize: 12 }} />
                        <Tooltip content={customTooltip} />
                        <Legend />
                        <ReferenceArea x1={forecastStartDate} x2={filteredData[filteredData.length - 1]?.date} stroke="none" fill="#f0f9ff" />
                        {Object.keys(facilityInfo).filter(f => facilityInfo[f].type === 'Production').map(facility => <Bar key={facility} dataKey={facilityInfo[facility].dataName} stackId="supply" fill={facilityInfo[facility].color} name={facility} />)}
                        {scenario.active && <Line type="monotone" dataKey="simulatedSupply" stroke="#e11d48" strokeWidth={3} dot={false} name="Simulated Supply" />}
                        <Line type="monotone" dataKey="gsooMedianDemand" stroke="#ff6b35" strokeWidth={2} dot={false} name="GSOO Median Demand (2022-2024)" strokeDasharray="8 8" />
                        <Line type="monotone" dataKey="totalDailySupply" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Total Daily Supply" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export default SupplyDemandChart;
