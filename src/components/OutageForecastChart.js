import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Card from './Card';
import { AlertTriangle } from 'lucide-react';
import { PRODUCTION_FACILITIES } from '../config';

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

    const statusColors = {
        Normal: '#22c55e',
        Maintenance: '#f59e0b',
        Construction: '#dc2626',
    };

    return (
        <Card>
            <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Outage & Shortfall Forecast</h2>
                    <p className="text-sm text-gray-500">Next 90 days of available capacity vs. forecasted demand.</p>
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
                        {PRODUCTION_FACILITIES.map((facilityName, index) => (
                            <Bar key={facilityName} dataKey={facilityName} stackId="capacity" name={facilityName}>
                                {chartData.map((entry, cellIndex) => (
                                    <Cell key={`cell-${cellIndex}`} fill={statusColors[entry[`${facilityName}_status`]] || '#8884d8'} />
                                ))}
                            </Bar>
                        ))}
                        <Line type="monotone" dataKey="demandForecast" stroke="#1e40af" strokeWidth={3} name="Forecast Demand" dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default OutageForecastChart;
