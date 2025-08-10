import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Card from './Card';
import { PRODUCTION_FACILITIES } from '../config';

const statusColors = {
    Normal: '#22c55e',
    Maintenance: '#f59e0b',
    Construction: '#dc2626',
};

// This function transforms the daily data into segments for the Gantt chart
const transformDataForGantt = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return [];

    const segments = [];
    PRODUCTION_FACILITIES.forEach(facilityName => {
        let currentSegment = null;

        dailyData.forEach((day) => {
            const status = day[`${facilityName}_status`];
            const date = new Date(day.date);

            if (!currentSegment) {
                currentSegment = {
                    facility: facilityName,
                    status: status,
                    start: date,
                    end: date,
                };
            } else if (status === currentSegment.status) {
                currentSegment.end = date;
            } else {
                segments.push(currentSegment);
                currentSegment = {
                    facility: facilityName,
                    status: status,
                    start: date,
                    end: date,
                };
            }
        });

        if (currentSegment) {
            segments.push(currentSegment);
        }
    });

    return segments.map(s => ({
        ...s,
        range: [s.start.getTime(), s.end.getTime() + (24 * 60 * 60 * 1000 - 1)], // full day
    }));
};


const FacilityOutageGanttChart = ({ outageForecastData }) => {
    const ganttData = useMemo(() => transformDataForGantt(outageForecastData), [outageForecastData]);

    const facilities = PRODUCTION_FACILITIES;
    const domain = useMemo(() => {
        const start = new Date();
        const end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 90);
        end.setHours(23, 59, 59, 999);
        return [start.getTime(), end.getTime()];
    }, []);

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Facility Outage Schedule</h2>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <BarChart layout="vertical" data={ganttData} margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            domain={domain}
                            tickFormatter={(time) => new Date(time).toLocaleDateString('en-CA')}
                            tickCount={5}
                            scale="time"
                        />
                        <YAxis type="category" dataKey="facility" domain={facilities} width={100} />
                        <Tooltip
                            formatter={(value, name, props) => {
                                const { payload } = props;
                                return [`Status: ${payload.status}`, ''];
                            }}
                            labelFormatter={(label, payload) => {
                                if(payload && payload[0]) {
                                    return `Facility: ${payload[0].payload.facility}`;
                                }
                                return '';
                            }}
                        />
                        <Legend />
                        <Bar dataKey="range" stackId="a">
                             {ganttData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default FacilityOutageGanttChart;
