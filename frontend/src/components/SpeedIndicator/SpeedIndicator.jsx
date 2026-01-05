import { getSpeedColor } from '../../utils/colorUtils';
import './SpeedIndicator.css';

export default function SpeedIndicator({ speed }) {
  return (
    <div className="speed-indicator">
      <div className="indicator-bar">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`indicator-segment ${speed >= level ? 'active' : ''}`}
            style={{
              backgroundColor: speed >= level ? getSpeedColor(level) : '#3a3a4a',
            }}
          />
        ))}
      </div>
      <div className="indicator-labels">
        <span style={{ color: getSpeedColor(1) }}>Slow</span>
        <span style={{ color: getSpeedColor(5) }}>Fast</span>
      </div>
    </div>
  );
}
