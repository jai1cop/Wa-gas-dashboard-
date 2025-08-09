import React from 'react';
import { Lightbulb } from 'lucide-react';
import Card from './Card';

const StrategySection = () => (
    <Card>
        <div className="flex items-center mb-2">
            <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-800">Market Insights & Strategy</h2>
        </div>
        <p className="text-sm text-gray-600">
            The WA gas market is currently in a near-term surplus, but forecasts indicate a potential supply gap in 2028, followed by a growing deficit from 2030. This suggests opportunities for flexible supply sources and storage solutions to manage increasing demand variability, especially with the rise of gas-powered generation to support renewables.
        </p>
    </Card>
);

export default StrategySection;
