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

        dailyData.forEach((day, index) => {
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

            if (index === dailyData.length - 1) {
                segments.push(currentSegment);
            }
        });
    });

    return segments.map(s => ({
        ...s,
        range: [s.start.getTime(), s.end.getTime() + (24*60*60*1000 - 1)], // full day
    }));
};


const FacilityOutageGanttChart = ({ outageForecastData }) => {
    const ganttData = useMemo(() => transformDataForGantt(outageForecastData), [outageForecastData]);

    const facilities = PRODUCTION_FACILITIES;
    const domain = useMemo(() => {
        if(ganttData.length === 0) return [0, 0];
        const start = ganttData[0].range[0];
        const end = ganttData[ganttData.length - 1].range[1];
        return [start, end];
    }, [ganttData]);

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
