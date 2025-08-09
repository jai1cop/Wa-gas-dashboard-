import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';
import { AlertTriangle } from 'lucide-react';

const OutageForecastChart = ({ data, demandForecast }) => {
    if (!data || data.length === 0) {
        return (
            <Card>
                <h2 className="text-xl font-bold text-gray-800">Outage & Shortfall Forecast</h2>
                <p className="text-center text-gray-500 py-8">No outage data available.</p>
            </Card>
        );
    }

    const chartData = data.map(d => ({ ...d, demandForecast }));

    return (
        <Card>
            <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Outage & Shortfall Forecast</h2>
                    <p className="text-sm text-gray-500">Next 90 days of scheduled outages vs. forecasted demand.</p>
                </div>
            </div>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft', fill: '#6b7280' }} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="availableCapacity" stackId="1" stroke="#22c55e" fill="#22c55e" name="Available Capacity" />
                        <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Maintenance Outage" />
                        <Area type="monotone" dataKey="construction" stackId="1" stroke="#dc2626" fill="#dc2626" name="Construction Outage" />
                        <Line type="monotone" dataKey="demandForecast" stroke="#3b82f6" strokeWidth={3} name="Forecast Demand" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default OutageForecastChart;
