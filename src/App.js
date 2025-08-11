import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import { getLinepackCapacityAdequacyCurrent, getEndUserConsumptionCurrent, getCapacityOutlookCurrent } from './api/gbb';
import { nowAwst, formatAwst, firstDefined } from './lib/time';
import './App.css';

function App() {
  const [tiles, setTiles] = useState({
    supply: { value: 'N/A', error: null, updated: null },
    consumption: { value: 'N/A', error: null, updated: null },
    linepack: { status: 'N/A', error: null, updated: null }
  });
  const [loadingTiles, setLoadingTiles] = useState(true);
  const [tilesError, setTilesError] = useState(null);

  const fetchTiles = useCallback(async () => {
    setLoadingTiles(true);
    setTilesError(null);
    try {
      const [lca, euc, co] = await Promise.all([
        getLinepackCapacityAdequacyCurrent(),
        getEndUserConsumptionCurrent(),
        getCapacityOutlookCurrent()
      ]);

      // Consumption (sum if necessary)
      let consumption;
      if (euc?.error) {
        consumption = { value: 'N/A', error: euc.error, updated: null };
      } else {
        const rows = Array.isArray(euc?.rows) ? euc.rows : (Array.isArray(euc?.data) ? euc.data : []);
        const total = rows.reduce((sum, r) => {
          const candidates = ['total', 'Total', 'totalTJ', 'total_tj'];
          const totalField = candidates.map(k => Number(r?.[k])).find(v => Number.isFinite(v) && v > 0);
          if (Number.isFinite(totalField)) return sum + totalField;
          const parts = ['largeUser', 'distribution', 'other']
            .map(k => Number(r?.[k]) || 0)
            .reduce((a, b) => a + b, 0);
          return sum + parts;
        }, 0);
        const updated = firstDefined(euc?.asAt, euc?.gasDay, euc?.timestamp, nowAwst());
        consumption = { value: Number.isFinite(total) ? Math.round(total) : 'N/A', error: null, updated };
      }

      // Supply mirrors consumption until flows API wired
      const supply = consumption.value !== 'N/A'
        ? { value: consumption.value, error: null, updated: consumption.updated }
        : { value: 'N/A', error: 'Supply not available', updated: null };

      // Linepack status
      const linepack = lca?.error
        ? { status: 'N/A', error: lca.error, updated: null }
        : {
            status: ((lca?.status || lca?.result || lca?.data?.status) || 'N/A').toString().toUpperCase(),
            error: null,
            updated: firstDefined(lca?.asAt, lca?.gasDay, lca?.timestamp, nowAwst())
          };

      setTiles({ supply, consumption, linepack });
    } catch (e) {
      setTilesError(e.message || 'Unknown error');
      setTiles({
        supply: { value: 'N/A', error: e.message, updated: null },
        consumption: { value: 'N/A', error: e.message, updated: null },
        linepack: { status: 'N/A', error: e.message, updated: null }
      });
    } finally {
      setLoadingTiles(false);
    }
  }, []);

  useEffect(() => { fetchTiles(); }, [fetchTiles]);

  const renderTile = (title, value, unit, error) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        {error && (
          <div title={error}>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WA Gas Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time gas supply and consumption data
              </p>
            </div>
            <button
              onClick={fetchTiles}
              disabled={loadingTiles}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              {loadingTiles ? <Loader className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tilesError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{tilesError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {renderTile('Total Supply', tiles.supply.value, 'TJ', tiles.supply.error)}
          {renderTile('Total Consumption', tiles.consumption.value, 'TJ', tiles.consumption.error)}
          {renderTile('Linepack Status', tiles.linepack.status, '', tiles.linepack.error)}
        </div>
        <div className="text-right text-sm text-gray-500">
          Last updated: {formatAwst(tiles.consumption.updated || tiles.supply.updated || tiles.linepack.updated)}
        </div>
      </div>
    </div>
  );
}

export default App;
