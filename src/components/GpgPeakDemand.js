import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './Card';

const gpgData = [
    { year: 2025, peak: 320 },
    { year: 2026, peak: 340 },
    { year: 2027, peak: 280 },
    { year: 2028, peak: 330 },
    { year: 2029, peak: 335 },
    { year: 2030, peak: 415 },
    { year: 2031, peak: 525 },
    { year: 2032, peak: 480 },
    { year: 2033, peak: 485 },
    { year: 2034, peak: 480 },
];

const GpgPeakDemand = () => (
    <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-2">GPG Peak Daily Demand Forecast</h2>
        <p className="text-sm text-gray-500 mb-4">Projected growth in peak daily gas demand for gas-powered generation (GPG) in the SWIS.</p>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={gpgData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'TJ/day', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="peak" name="Peak GPG Demand" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </Card>
);

export default GpgPeakDemand;
