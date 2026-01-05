import { useHome } from '../../context/HomeContext';
import './RoomCard.css';

const roomIcons = {
  living_room: '🛋️',
  bedroom: '🛏️',
  kitchen: '🍳',
  bathroom: '🚿',
  office: '💼',
  default: '🏠'
};

export default function RoomCard({ room, onClick }) {
  const { getDevicesByRoom } = useHome();
  const devices = getDevicesByRoom(room.id);
  const devicesOn = devices.filter(d => d.state?.on).length;

  return (
    <div className="room-card" onClick={onClick}>
      <div className="room-header">
        <span className="room-icon">{roomIcons[room.id] || roomIcons.default}</span>
        <h2 className="room-name">{room.name}</h2>
      </div>

      {room.environment && (
        <div className="room-environment">
          <span className="env-item">
            🌡️ {room.environment.temperature?.toFixed(1)}°C
          </span>
          <span className="env-item">
            💧 {room.environment.humidity?.toFixed(0)}%
          </span>
        </div>
      )}

      <div className="room-stats">
        <div className={`stat ${devicesOn > 0 ? 'active' : ''}`}>
          <span className="stat-value">{devicesOn}/{devices.length}</span>
          <span className="stat-label">devices on</span>
        </div>
      </div>

      <div className="device-icons">
        {devices.slice(0, 4).map(device => (
          <span
            key={device.id}
            className={`mini-device ${device.state?.on ? 'on' : 'off'}`}
            title={device.name}
          >
            {device.type === 'light' && '💡'}
            {device.type === 'fan' && '🌀'}
            {device.type === 'ac' && '❄️'}
            {device.type === 'tv' && '📺'}
            {device.type === 'appliance' && '🔌'}
          </span>
        ))}
        {devices.length > 4 && (
          <span className="more-devices">+{devices.length - 4}</span>
        )}
      </div>
    </div>
  );
}
