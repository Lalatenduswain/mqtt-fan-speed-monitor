import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeProvider } from './context/HomeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoomDetail from './pages/RoomDetail';
import EnergyMonitor from './pages/EnergyMonitor';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
    setCurrentView('room');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedRoomId(null);
  };

  const navigateTo = (view) => {
    setCurrentView(view);
    setSelectedRoomId(null);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <HomeProvider>
      <div className="app">
        {/* User header bar */}
        <header className="user-header">
          <div className="user-info">
            <span className="user-avatar">
              {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="user-name">{user?.display_name || user?.username}</span>
            {user?.role === 'admin' && <span className="user-badge">Admin</span>}
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">
            <span>Logout</span>
          </button>
        </header>

        {currentView === 'dashboard' && (
          <Dashboard onRoomSelect={handleRoomSelect} />
        )}
        {currentView === 'room' && selectedRoomId && (
          <RoomDetail roomId={selectedRoomId} onBack={handleBack} />
        )}
        {currentView === 'energy' && (
          <EnergyMonitor />
        )}
        {currentView === 'schedules' && (
          <Schedules />
        )}
        {currentView === 'settings' && (
          <Settings />
        )}

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <button
            className={`nav-item ${currentView === 'dashboard' || currentView === 'room' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button
            className={`nav-item ${currentView === 'energy' ? 'active' : ''}`}
            onClick={() => navigateTo('energy')}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Energy</span>
          </button>
          <button
            className={`nav-item ${currentView === 'schedules' ? 'active' : ''}`}
            onClick={() => navigateTo('schedules')}
          >
            <span className="nav-icon">⏰</span>
            <span className="nav-label">Schedules</span>
          </button>
          <button
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      </div>
    </HomeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
