import {
  LayoutDashboard,
  Video,
  AlertTriangle,
  BarChart3,
  MapPin,
  LogOut,
  Shield,
  Volume2,
  VolumeX,
  Radio,
  Circle,
} from 'lucide-react';
import { useStore } from '../store';
import { useRealtime } from '../hooks/useRealtime';
import Toast from './Toast';

type PageType = 'dashboard' | 'live' | 'alerts' | 'analytics' | 'zones';

const navItems = [
  { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live' as PageType, label: 'Live', icon: Video },
  { id: 'alerts' as PageType, label: 'Alerts', icon: AlertTriangle },
  { id: 'analytics' as PageType, label: 'Analytics', icon: BarChart3 },
  { id: 'zones' as PageType, label: 'Zones', icon: MapPin },
];

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, setUser, audioEnabled, toggleAudio, realtimeEnabled, toggleRealtime } = useStore();

  // Enable realtime simulation
  useRealtime();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">SafeBake</h1>
              <p className="text-xs text-gray-500">Security System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Controls - SOUND TOGGLE HIDDEN */}
        {/* <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={toggleAudio}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
          >
            <div className="flex items-center gap-2">
              {audioEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {audioEnabled ? 'Sound On' : 'Sound Off'}
              </span>
            </div>
          </button>
        </div> */}

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full bg-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'viewer'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Toast Container - Side notifications disabled */}
      {/* <Toast /> */}
    </div>
  );
}
