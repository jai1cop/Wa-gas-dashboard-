import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Card from './Card';

const forecastData = [
    { year: 2025, supply: 1190, consumption: 1069 },
    { year: 2026, supply: 1121, consumption: 1082 },
    { year: 2027, supply: 1207, consumption: 1154 },
    { year: 2028, supply: 1192, consumption: 1354 },
    { year: 2029, supply: 1412, consumption: 1342 },
    { year: 2030, supply: 1335, consumption: 1357 },
    { year: 2031, supply: 1301, consumption: 1378 },
    { year: 2032, supply: 1214, consumption: 1371 },
    { year: 2033, supply: 1173, consumption: 1343 },
    { year: 2034, supply: 1144, consumption: 1336 },
];

const ForecastChart = () => (
    <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-2">GSOO 2024 Supply vs. Demand Forecast (2025-2034)</h2>
        <p className="text-sm text-gray-500 mb-4">This chart illustrates the projected supply and demand balance over the next decade, highlighting potential future supply gaps.</p>
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <ComposedChart data={forecastData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consumption" name="Projected Demand" fill="#f87171" />
                    <Line type="monotone" dataKey="supply" name="Projected Supply" stroke="#60a5fa" strokeWidth={3} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </Card>
);

export default ForecastChart;
