import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Calendar, Thermometer, Zap, Activity } from 'lucide-react';
import { fetchGasData, endpoints } from './api/gbb';
import { formatDateTime, formatTime, getTimeRange, isRecent } from './lib/time';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current data for tiles
      const current = await fetchGasData(endpoints.current);
      setCurrentData(current);

      // Fetch recent data for charts
      const timeRange = getTimeRange('24h');
      const chartData = await fetchGasData(endpoints.production, {
        start: timeRange.start,
        end: timeRange.end
      });

      setData(Array.isArray(chartData) ? chartData : []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const tiles = [
    {
      title: 'Current Production',
      value: currentData?.production || '0',
      unit: 'PJ/day',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Storage Level',
      value: currentData?.storage || '0',
      unit: 'PJ',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Temperature',
      value: currentData?.temperature || '0',
      unit: '°C',
      icon: Thermometer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Last Updated',
      value: lastUpdate ? formatTime(lastUpdate) : '--:--',
      unit: '',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gas data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time gas production and storage data
                {lastUpdate && (
                  <span className="ml-2">
                    • Last updated: {formatDateTime(lastUpdate)}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Data Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tiles.map((tile, index) => {
            const IconComponent = tile.icon;
            return (
              <div key={index} className={`${tile.bgColor} rounded-xl p-6 border border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{tile.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {tile.value}
                      {tile.unit && <span className="text-sm font-normal text-gray-500 ml-1">{tile.unit}</span>}
                    </p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${tile.color}`} />
                </div>
                {isRecent(lastUpdate, 0.25) && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Production Trend (24h)</h2>
            <div className="text-sm text-gray-500">
              {data.length} data points
            </div>
          </div>

          {data.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                  <Tooltip
                    labelFormatter={(label) => formatDateTime(label)}
                    formatter={(value) => [`${value} PJ/day`, 'Production']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e4e7',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="production"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No chart data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
