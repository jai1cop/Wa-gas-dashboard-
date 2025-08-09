import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PageTitle = ({ children, backAction }) => (
    <div className="flex items-center mb-6">
        {backAction && <button onClick={backAction} className="p-2 rounded-full hover:bg-gray-200 mr-4"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{children}</h1>
    </div>
);

export default PageTitle;
