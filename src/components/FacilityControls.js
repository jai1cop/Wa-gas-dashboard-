import React, { useState } from 'react';
import { Settings, ChevronUp, ChevronDown } from 'lucide-react';
import Card from './Card';

const FacilityControls = ({ facilityInfo, activeFacilities, setActiveFacilities }) => {
    const [isOpen, setIsOpen] = useState(false);
    const productionFacilities = Object.keys(facilityInfo).filter(name => facilityInfo[name].type === 'Production');

    if (productionFacilities.length === 0) return null;

    return (
        <Card>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <div className="flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-800">Facility Supply Controls</h2>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {productionFacilities.map(name => (
                        <div key={name} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`facility-${name}`}
                                checked={!!activeFacilities[name]}
                                onChange={() => setActiveFacilities(prev => ({ ...prev, [name]: !prev[name] }))}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`facility-${name}`} className="ml-2 block text-sm text-gray-900">{name}</label>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default FacilityControls;
