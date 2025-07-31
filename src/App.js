import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

// --- API & CONFIGURATION ---
const AEMO_API_BASE_URL = "/api/report";

// --- HELPER COMPONENTS ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 ${className}`}>{children}</div>;

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-96">
        <Loader className="w-16 h-16 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Attempting simple connection to AEMO...</p>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <Card className="border-l-4 border-red-500">
        <div className="flex">
            <div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Failed to Load Live Data</h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                    <p className="mt-1 font-bold">This is a network or proxy issue. Please double-check that the `netlify.toml` file in your project's root directory is exactly as provided.</p>
                </div>
            </div>
        </div>
    </Card>
);

const SuccessDisplay = ({ data }) => (
    <Card className="border-l-4 border-green-500">
        <div className="flex">
            <div className="flex-shrink-0"><AlertTriangle className="h-6 w-6 text-green-600" /></div>
            <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Connection Successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                    <p>Successfully fetched the AEMO Capacity Outlook report.</p>
                    <p>Report ID: <span className="font-mono">{data.reportId}</span></p>
                    <p>Generated on: {new Date(data.asAt).toLocaleString()}</p>
                    <p className="mt-2 font-bold">Now you can revert to the previous full-featured version of `App.js`.</p>
                </div>
            </div>
        </div>
    </Card>
);


// --- MAIN APP COMPONENT ---
export default function App() {
    const [liveData, setLiveData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTestData = async () => {
            setLoading(true); 
            setError(null);
            try {
                const res = await fetch(`${AEMO_API_BASE_URL}/capacityOutlook/current`);
                if (!res.ok) {
                    throw new Error(`AEMO API returned status: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setLiveData(data);
            } catch (err) {
                console.error("API Fetch Error:", err);
                // Check if the error is a TypeError, which often indicates a failed fetch/CORS issue
                if (err instanceof TypeError) {
                    setError("Failed to fetch. This strongly indicates a proxy configuration problem. Please verify your `netlify.toml` file.");
                } else {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTestData();
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard - Connection Test</h1>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} />}
                {liveData && <SuccessDisplay data={liveData} />}
            </main>
        </div>
    );
}
