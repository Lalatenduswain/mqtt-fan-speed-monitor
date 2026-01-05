import { useHome } from '../../context/HomeContext';
import './DeviceCard.css';

// Device type icons (using simple emoji for now, can be replaced with lucide-react icons)
const deviceIcons = {
  light: '💡',
  fan: '🌀',
  ac: '❄️',
  tv: '📺',
  appliance: '🔌',
  sensor: '📊'
};

export default function DeviceCard({ device }) {
  const { controlDevice, toggleDevice } = useHome();
  const isOn = device.state?.on;

  const handleToggle = () => {
    toggleDevice(device.id);
  };

  const handleSpeedChange = (speed) => {
    controlDevice(device.id, { on: true, speed });
  };

  const handleTempChange = (temp) => {
    controlDevice(device.id, { temp });
  };

  return (
    <div className={`device-card ${isOn ? 'on' : 'off'} ${device.is_online ? '' : 'offline'}`}>
      <div className="device-header">
        <span className="device-icon">{deviceIcons[device.type] || '🔌'}</span>
        <div className="device-info">
          <h3 className="device-name">{device.name}</h3>
          <span className={`device-status ${isOn ? 'on' : 'off'}`}>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>
        <button
          className={`toggle-btn ${isOn ? 'on' : 'off'}`}
          onClick={handleToggle}
          aria-label={`Turn ${device.name} ${isOn ? 'off' : 'on'}`}
        >
          <div className="toggle-slider" />
        </button>
      </div>

      {/* Fan Speed Control */}
      {device.type === 'fan' && isOn && (
        <div className="device-controls">
          <label>Speed</label>
          <div className="speed-buttons">
            {[1, 2, 3, 4, 5].map(speed => (
              <button
                key={speed}
                className={`speed-btn ${device.state?.speed === speed ? 'active' : ''}`}
                onClick={() => handleSpeedChange(speed)}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AC Temperature Control */}
      {device.type === 'ac' && isOn && (
        <div className="device-controls">
          <div className="temp-control">
            <button
              className="temp-btn"
              onClick={() => handleTempChange((device.state?.temp || 24) - 1)}
            >
              -
            </button>
            <span className="temp-value">{device.state?.temp || 24}°C</span>
            <button
              className="temp-btn"
              onClick={() => handleTempChange((device.state?.temp || 24) + 1)}
            >
              +
            </button>
          </div>
          <div className="mode-buttons">
            {['cool', 'fan', 'dry', 'auto'].map(mode => (
              <button
                key={mode}
                className={`mode-btn ${device.state?.mode === mode ? 'active' : ''}`}
                onClick={() => controlDevice(device.id, { mode })}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {!device.is_online && (
        <div className="offline-badge">Offline</div>
      )}
    </div>
  );
}
