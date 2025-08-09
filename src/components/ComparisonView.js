import React from 'react';
import MetricComparisonCard from './MetricComparisonCard';
import SupplyDemandChart from './SupplyDemandChart'; // Import the chart

const calculateMetrics = (data) => {
    if (!data || data.length === 0) {
        return {
            avgSupply: 0,
            avgDemand: 0,
            avgBalance: 0,
            days: 0,
        };
    }

    const totalSupply = data.reduce((sum, d) => sum + (d.totalSupply || 0), 0);
    const totalDemand = data.reduce((sum, d) => sum + (d.totalDemand || 0), 0);

    const days = data.length;

    return {
        avgSupply: totalSupply / days,
        avgDemand: totalDemand / days,
        avgBalance: (totalSupply - totalDemand) / days,
        days: days,
    };
};


const ComparisonView = ({ liveData, periodA, periodB }) => {
    const startA = new Date(periodA.start).getTime();
    const endA = new Date(periodA.end).getTime();
    const startB = new Date(periodB.start).getTime();
    const endB = new Date(periodB.end).getTime();

    const dataA = liveData.processedFlows.filter(d => d.timestamp >= startA && d.timestamp <= endA);
    const dataB = liveData.processedFlows.filter(d => d.timestamp >= startB && d.timestamp <= endB);

    const metricsA = calculateMetrics(dataA);
    const metricsB = calculateMetrics(dataB);

    // Pass the full facilityInfo and an empty scenario object to the charts
    const facilityInfo = liveData.facilityInfo;
    const emptyScenario = { active: false };

    return (
        <div className="mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Comparison Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricComparisonCard
                    title="Avg. Daily Supply"
                    valueA={metricsA.avgSupply}
                    valueB={metricsB.avgSupply}
                    unit=" TJ"
                />
                <MetricComparisonCard
                    title="Avg. Daily Consumption"
                    valueA={metricsA.avgDemand}
                    valueB={metricsB.avgDemand}
                    unit=" TJ"
                />
                <MetricComparisonCard
                    title="Avg. Daily Balance"
                    valueA={metricsA.avgBalance}
                    valueB={metricsB.avgBalance}
                    unit=" TJ"
                />
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Chart Comparison</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-lg font-bold text-blue-600 mb-2">Period A: {periodA.start} to {periodA.end}</h4>
                        <SupplyDemandChart
                            data={dataA}
                            facilityInfo={facilityInfo}
                            scenario={emptyScenario}
                            forecastStartDate={null}
                        />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-green-600 mb-2">Period B: {periodB.start} to {periodB.end}</h4>
                        <SupplyDemandChart
                            data={dataB}
                            facilityInfo={facilityInfo}
                            scenario={emptyScenario}
                            forecastStartDate={null}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;
