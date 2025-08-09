import React, { useState } from 'react';
import PageTitle from '../components/PageTitle';
import DateRangeSelector from '../components/DateRangeSelector';
import ComparisonView from '../components/ComparisonView';

const ComparisonPage = ({ liveData, navigateTo }) => {
    // Default to the last 30 days for Period A
    const defaultEndDateA = new Date(liveData.processedFlows[liveData.processedFlows.length - 1]?.timestamp);
    const defaultStartDateA = new Date(defaultEndDateA);
    defaultStartDateA.setDate(defaultStartDateA.getDate() - 30);

    // Default to the 30 days before that for Period B
    const defaultEndDateB = new Date(defaultStartDateA);
    defaultEndDateB.setDate(defaultEndDateB.getDate() - 1);
    const defaultStartDateB = new Date(defaultEndDateB);
    defaultStartDateB.setDate(defaultStartDateB.getDate() - 30);

    const [periodA, setPeriodA] = useState({
        start: defaultStartDateA.toISOString().split('T')[0],
        end: defaultEndDateA.toISOString().split('T')[0],
    });

    const [periodB, setPeriodB] = useState({
        start: defaultStartDateB.toISOString().split('T')[0],
        end: defaultEndDateB.toISOString().split('T')[0],
    });

    return (
        <div>
            <PageTitle backAction={() => navigateTo('dashboard')}>Historical Comparison</PageTitle>
            <div className="p-4 bg-white rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">Select Periods to Compare</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-lg font-bold text-blue-600 mb-2">Period A</h4>
                        <DateRangeSelector period={periodA} setPeriod={setPeriodA} color="blue" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-green-600 mb-2">Period B</h4>
                        <DateRangeSelector period={periodB} setPeriod={setPeriodB} color="green" />
                    </div>
                </div>
            </div>

            <ComparisonView liveData={liveData} periodA={periodA} periodB={periodB} />
        </div>
    );
};

export default ComparisonPage;
