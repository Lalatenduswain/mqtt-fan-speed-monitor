import { useHome } from '../context/HomeContext';
import RoomCard from '../components/RoomCard/RoomCard';
import SceneButton from '../components/SceneButton/SceneButton';
import './Dashboard.css';

export default function Dashboard({ onRoomSelect }) {
  const { rooms, scenes, devices, connectionStatus, loading } = useHome();

  // Calculate summary stats
  const totalDevices = devices.length;
  const devicesOn = devices.filter(d => d.state?.on).length;

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Home</h1>
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot"></span>
            {connectionStatus === 'connected' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{devicesOn}</span>
            <span className="stat-label">devices on</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalDevices}</span>
            <span className="stat-label">total</span>
          </div>
        </div>
      </header>

      {/* Quick Scenes */}
      {scenes.length > 0 && (
        <section className="scenes-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="scenes-grid">
            {scenes.map(scene => (
              <SceneButton key={scene.id} scene={scene} />
            ))}
          </div>
        </section>
      )}

      {/* Rooms */}
      <section className="rooms-section">
        <h2 className="section-title">Rooms</h2>
        <div className="rooms-grid">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => onRoomSelect(room.id)}
            />
          ))}
        </div>
      </section>

      {rooms.length === 0 && (
        <div className="empty-state">
          <p>No rooms configured yet.</p>
          <p className="hint">Add rooms via the API or database.</p>
        </div>
      )}
    </div>
  );
}
