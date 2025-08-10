import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';
import { PRODUCTION_FACILITIES } from '../config';

const blueShades = [
  '#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#2196f3',
  '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd'
];

const TotalCapacityChart = ({ outageForecastData, demandForecast }) => {
  const chartData = outageForecastData.map(d => ({ ...d, demandForecast }));

  return (
    <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Total Capacity Forecast</h2>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {PRODUCTION_FACILITIES.map((facility, index) => (
                        <Area
                            key={facility}
                            type="monotone"
                            dataKey={facility}
                            stackId="1"
                            stroke={blueShades[index % blueShades.length]}
                            fill={blueShades[index % blueShades.length]}
                            name={facility}
                        />
                    ))}
                    <Line
                        type="monotone"
                        dataKey="demandForecast"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={false}
                        name="Forecast Demand"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </Card>
  );
};

export default TotalCapacityChart;
