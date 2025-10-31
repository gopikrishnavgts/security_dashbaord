import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Camera,
  Shield,
  Clock,
  Target,
  Users,
  UserCheck,
} from 'lucide-react';
import { persistenceService } from '../services/persistence';
import { formatPercent, formatRelative, formatEventType, getEventColor } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Generate chart data for past 7 days
function generateChartData() {
  const allAlerts = persistenceService.getAllAlerts();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayAlerts = allAlerts.filter(alert => {
      const alertDate = new Date(alert.startedAt);
      return alertDate >= dayStart && alertDate <= dayEnd;
    });

    data.push({
      day: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      alerts: dayAlerts.length,
      verified: dayAlerts.filter(a => a.status === 'verified').length,
      dismissed: dayAlerts.filter(a => a.status === 'dismissed').length,
    });
  }

  return data;
}

export default function Dashboard() {
  const [stats, setStats] = useState(persistenceService.getStats());
  const [recentAlerts, setRecentAlerts] = useState(persistenceService.getAllAlerts().slice(0, 8));

  // Refresh stats every 5 seconds to show realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(persistenceService.getStats());
      setRecentAlerts(persistenceService.getAllAlerts().slice(0, 8));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate chart data for past 7 days
  const chartData = generateChartData();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time monitoring and analytics</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
          <span className="text-sm text-gray-400">• Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Alerts (24h)"
          value={stats.totalAlerts24h}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Pending Review"
          value={stats.pendingReview}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
          trend={stats.pendingReview ? `${stats.pendingReview} awaiting action` : 'All clear'}
        />
        <KPICard
          title="Detection Accuracy"
          value={formatPercent(stats.detectionAccuracy)}
          icon={<Target className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Total Alerts"
          value={stats.totalAlerts}
          icon={<CheckCircle className="w-6 h-6" />}
          color="emerald"
          trend={`${stats.verifiedAlerts} verified, ${stats.dismissedAlerts} dismissed`}
        />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <HealthCard
          title="Active Cameras"
          value="5"
          icon={<Camera className="w-5 h-5" />}
        />
        <HealthCard
          title="Monitored Zones"
          value="3"
          icon={<Shield className="w-5 h-5" />}
        />
        <HealthCard
          title="Verified Alerts"
          value={String(stats.verifiedAlerts)}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <HealthCard
          title="System Uptime"
          value="99.8%"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Alert Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Alert Trend (Past 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="alerts" stroke="#3b82f6" strokeWidth={2} name="Alerts" />
            <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
            <Line type="monotone" dataKey="dismissed" stroke="#6b7280" strokeWidth={2} name="Dismissed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <span className="text-sm text-gray-500">Last 8 alerts</span>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventColor(alert.event)}`}>
                {formatEventType(alert.event)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {alert.cameraId} - Confidence: {Math.round(alert.score * 100)}%
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelative(alert.startedAt)}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                alert.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : alert.status === 'verified'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {alert.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-2 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {trend && <p className="text-xs text-gray-500">{trend}</p>}
    </div>
  );
}

function HealthCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="text-gray-600">{icon}</div>
        <div>
          <p className="text-xs text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
