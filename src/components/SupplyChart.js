import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import Card from './Card';

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

export default SupplyChart;
