import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Calendar } from 'lucide-react';
import { persistenceService } from '../services/persistence';
import { formatEventType } from '../utils';

const TIME_RANGES = [
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 24 * 7 },
  { label: '30 Days', hours: 24 * 30 },
  { label: '60 Days', hours: 24 * 60 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState(TIME_RANGES[2]); // Default to 30 days

  const allAlerts = persistenceService.getAllAlerts();

  // Filter alerts by time range
  const filteredAlerts = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - timeRange.hours * 60 * 60 * 1000);

    return allAlerts.filter(alert => {
      const alertDate = new Date(alert.startedAt);
      return alertDate >= from && alertDate <= now;
    });
  }, [allAlerts, timeRange]);

  // Generate daily data for line chart
  const dailyData = useMemo(() => {
    const days = Math.min(timeRange.hours / 24, 30); // Max 30 days for chart
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayAlerts = filteredAlerts.filter(alert => {
        const alertDate = new Date(alert.startedAt);
        return alertDate >= dayStart && alertDate <= dayEnd;
      });

      // Calculate cap compliance for this day
      const totalFrames = dayAlerts.reduce((sum, alert) => {
        return sum + (alert.frameData?.employeeCount || 0);
      }, 0);

      const capsWorn = dayAlerts.reduce((sum, alert) => {
        return sum + (alert.frameData?.capsWorn || 0);
      }, 0);

      const capsNotWorn = dayAlerts.reduce((sum, alert) => {
        return sum + (alert.frameData?.capsNotWorn || 0);
      }, 0);

      const complianceRate = totalFrames > 0 ? ((capsWorn / (capsWorn + capsNotWorn)) * 100) : 100;

      data.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        alerts: dayAlerts.length,
        verified: dayAlerts.filter(a => a.status === 'verified').length,
        dismissed: dayAlerts.filter(a => a.status === 'dismissed').length,
        pending: dayAlerts.filter(a => a.status === 'pending').length,
        capsWorn,
        capsNotWorn,
        complianceRate: Math.round(complianceRate),
      });
    }

    return data;
  }, [filteredAlerts, timeRange]);

  // Event distribution
  const eventData = useMemo(() => {
    const eventCounts: Record<string, number> = {};

    filteredAlerts.forEach(alert => {
      eventCounts[alert.event] = (eventCounts[alert.event] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .map(([event, count]) => ({
        name: formatEventType(event as any),
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAlerts]);

  // Camera performance
  const cameraData = useMemo(() => {
    const cameraCounts: Record<string, number> = {};

    filteredAlerts.forEach(alert => {
      cameraCounts[alert.cameraId] = (cameraCounts[alert.cameraId] || 0) + 1;
    });

    return Object.entries(cameraCounts)
      .map(([camera, count]) => ({
        camera,
        alerts: count,
      }))
      .sort((a, b) => b.alerts - a.alerts);
  }, [filteredAlerts]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Security insights and trends</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange.label === range.label
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Alert Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Alert Trends - {timeRange.label}</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="alerts" stroke="#3b82f6" strokeWidth={2} name="Total Alerts" />
              <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
              <Line type="monotone" dataKey="dismissed" stroke="#ef4444" strokeWidth={2} name="Dismissed" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cap Compliance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Cap Compliance Trends - {timeRange.label}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="capsWorn" fill="#10b981" name="Caps Worn" stackId="a" />
              <Bar yAxisId="left" dataKey="capsNotWorn" fill="#ef4444" name="Caps Not Worn" stackId="a" />
              <Line yAxisId="right" type="monotone" dataKey="complianceRate" stroke="#3b82f6" strokeWidth={3} name="Compliance Rate (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Event Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Event Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Events</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Camera Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cameraData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="camera" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="alerts" fill="#3b82f6" name="Alerts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Alerts</h3>
            <p className="text-3xl font-bold text-gray-900">
              {filteredAlerts.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">In selected period</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Verified Alerts</h3>
            <p className="text-3xl font-bold text-green-600">
              {filteredAlerts.filter(a => a.status === 'verified').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Confirmed incidents</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">False Positives</h3>
            <p className="text-3xl font-bold text-red-600">
              {filteredAlerts.filter(a => a.status === 'dismissed').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Dismissed alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
