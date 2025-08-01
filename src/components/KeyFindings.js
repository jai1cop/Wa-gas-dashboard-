import React from 'react';
import Card from './Card';
import { Lightbulb } from 'lucide-react';

const KeyFindings = () => (
    <Card>
        <div className="flex items-center mb-4">
            <Lightbulb className="w-6 h-6 mr-3 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-800">Key GSOO 2024 Findings</h2>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
            <li><span className="font-semibold">Near-Term Surplus:</span> Supply is expected to exceed demand until 2027.</li>
            <li><span className="font-semibold">Medium-Term Risk:</span> A potential supply gap is forecast for 2028 as new demand projects come online before new supply.</li>
            <li><span className="font-semibold">Long-Term Deficit:</span> An increasing supply deficit is projected from 2030 onwards, reaching up to 191 TJ/day by 2034.</li>
            <li><span className="font-semibold">GPG Peak Demand:</span> Daily peak gas usage for gas-powered generation is forecast to increase significantly, becoming more seasonal.</li>
        </ul>
    </Card>
);

export default KeyFindings;
