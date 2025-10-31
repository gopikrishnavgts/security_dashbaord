import { useState } from 'react';
import { MapPin, Camera, AlertTriangle, Trash2 } from 'lucide-react';
import { getRiskColor } from '../utils';
import { persistenceService } from '../services/persistence';
import { MOCK_ZONES, MOCK_CAMERAS } from '../data/mockData';

export default function Zones() {
  const [clickCount, setClickCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  const zones = MOCK_ZONES;
  const cameras = MOCK_CAMERAS;
  const allAlerts = persistenceService.getAllAlerts();

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 10) {
      setShowDebug(true);
      setClickCount(0);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
      persistenceService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-gray-900 cursor-pointer select-none"
          onClick={handleTitleClick}
        >
          Zones
        </h1>
        <p className="text-gray-500 mt-1">Monitor security zones and camera coverage</p>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones?.map((zone) => {
          const zoneCameras = cameras?.filter((c) => c.zoneId === zone.id) || [];
          const onlineCameras = zoneCameras.filter((c) => c.status === 'online').length;
          const zoneAlerts = allAlerts.filter((a) => a.zoneId === zone.id) || [];
          const pendingAlerts = zoneAlerts.filter((a) => a.status === 'pending').length;

          return (
            <div
              key={zone.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Zone Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{zone.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${getRiskColor(zone.riskLevel)}`}>
                      {zone.riskLevel} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Cameras */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Cameras</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {onlineCameras}/{zoneCameras.length} online
                  </span>
                </div>

                {/* Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Pending Alerts</span>
                  </div>
                  <span className={`text-sm font-semibold ${pendingAlerts > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {pendingAlerts}
                  </span>
                </div>

                {/* Total Alerts */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Total Alerts (all time)</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {zoneAlerts.length}
                  </span>
                </div>
              </div>

              {/* Camera List */}
              {zoneCameras.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                    Cameras in this zone
                  </h4>
                  <div className="space-y-2">
                    {zoneCameras.map((camera) => (
                      <div key={camera.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900">{camera.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            camera.status === 'online'
                              ? 'bg-green-100 text-green-700'
                              : camera.status === 'offline'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {camera.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zone Summary */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Zone Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Zones</p>
            <p className="text-3xl font-bold text-gray-900">{zones?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Cameras</p>
            <p className="text-3xl font-bold text-gray-900">{cameras?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Cameras Online</p>
            <p className="text-3xl font-bold text-green-600">
              {cameras?.filter((c) => c.status === 'online').length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Debug Section - Click title 10 times to reveal */}
      {showDebug && (
        <div className="mt-8 bg-red-50 border-2 border-red-500 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-900">Debug Controls</h2>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Current Data Status:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Total Alerts: {persistenceService.getAllAlerts().length}</li>
              <li>• Pending Alerts: {persistenceService.getPendingCount()}</li>
              <li>• Alert Count: {persistenceService.getAlertCount()}</li>
            </ul>
          </div>

          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Dashboard Data
          </button>

          <p className="text-xs text-red-600 mt-3 text-center">
            ⚠️ This will delete all alerts, stats, and initialization data. The page will reload with fresh data.
          </p>

          <button
            onClick={() => setShowDebug(false)}
            className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Hide Debug Controls
          </button>
        </div>
      )}
    </div>
  );
}
