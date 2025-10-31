import { useState, useEffect } from 'react';
import { useStore } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Live from './pages/Live';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Zones from './pages/Zones';

type PageType = 'dashboard' | 'live' | 'alerts' | 'analytics' | 'zones';

export default function App() {
  console.log('🚀 App component rendering...');

  try {
    const { user } = useStore();
    const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

    console.log('👤 User:', user);
    console.log('📄 Current page:', currentPage);

    useEffect(() => {
      console.log('✅ App mounted successfully');
    }, []);

    // If no user is logged in, show login page
    if (!user) {
      console.log('🔐 No user, showing Login page');
      return <Login />;
    }

    console.log('✨ User logged in, showing dashboard with Layout');

    // Render current page
    const renderPage = () => {
      console.log('🎨 Rendering page:', currentPage);
      try {
        switch (currentPage) {
          case 'dashboard':
            console.log('📊 Loading Dashboard component');
            return <Dashboard />;
          case 'live':
            console.log('📹 Loading Live component');
            return <Live />;
          case 'alerts':
            console.log('🚨 Loading Alerts component');
            return <Alerts />;
          case 'analytics':
            console.log('📈 Loading Analytics component');
            return <Analytics />;
          case 'zones':
            console.log('🗺️ Loading Zones component');
            return <Zones />;
          default:
            return <Dashboard />;
        }
      } catch (error) {
        console.error('❌ Error rendering page:', error);
        return (
          <div style={{ padding: '2rem' }}>
            <h1 style={{ color: 'red' }}>Error loading page: {currentPage}</h1>
            <pre>{String(error)}</pre>
          </div>
        );
      }
    };

    return (
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1 style={{ color: 'red' }}>Error in App Component</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}
