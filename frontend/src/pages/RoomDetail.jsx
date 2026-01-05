import { useHome } from '../context/HomeContext';
import DeviceCard from '../components/DeviceCard/DeviceCard';
import './RoomDetail.css';

export default function RoomDetail({ roomId, onBack }) {
  const { getRoom, getDevicesByRoom, controlDevice } = useHome();

  const room = getRoom(roomId);
  const devices = getDevicesByRoom(roomId);

  if (!room) {
    return (
      <div className="room-detail">
        <header className="room-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>Room not found</h1>
        </header>
      </div>
    );
  }

  // Group devices by type
  const devicesByType = devices.reduce((acc, device) => {
    const type = device.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(device);
    return acc;
  }, {});

  const typeOrder = ['light', 'fan', 'ac', 'tv', 'appliance', 'sensor'];
  const typeLabels = {
    light: 'Lights',
    fan: 'Fans',
    ac: 'Air Conditioners',
    tv: 'TVs',
    appliance: 'Appliances',
    sensor: 'Sensors'
  };

  // Quick actions for the room
  const turnAllOff = () => {
    devices.forEach(device => {
      if (device.state?.on) {
        controlDevice(device.id, { on: false });
      }
    });
  };

  const turnAllLightsOn = () => {
    devices.filter(d => d.type === 'light').forEach(device => {
      controlDevice(device.id, { on: true });
    });
  };

  return (
    <div className="room-detail">
      {/* Header */}
      <header className="room-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="room-title">
          <h1>{room.name}</h1>
          {room.environment && (
            <div className="room-env">
              <span>🌡️ {room.environment.temperature?.toFixed(1)}°C</span>
              <span>💧 {room.environment.humidity?.toFixed(0)}%</span>
            </div>
          )}
        </div>
      </header>

      {/* Quick Actions */}
      <section className="quick-actions">
        <button className="action-btn" onClick={turnAllLightsOn}>
          💡 All Lights On
        </button>
        <button className="action-btn danger" onClick={turnAllOff}>
          ⏻ All Off
        </button>
      </section>

      {/* Devices by Type */}
      {typeOrder.map(type => {
        const typeDevices = devicesByType[type];
        if (!typeDevices || typeDevices.length === 0) return null;

        return (
          <section key={type} className="device-section">
            <h2 className="section-title">{typeLabels[type]}</h2>
            <div className="devices-grid">
              {typeDevices.map(device => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </section>
        );
      })}

      {devices.length === 0 && (
        <div className="empty-state">
          <p>No devices in this room yet.</p>
        </div>
      )}
    </div>
  );
}
