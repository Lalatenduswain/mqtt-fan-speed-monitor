import { getSpeedColor, getSpeedLabel } from '../../utils/colorUtils';
import SpeedIndicator from '../SpeedIndicator/SpeedIndicator';
import './FanDisplay.css';

export default function FanDisplay({ speed }) {
  // Calculate rotation duration based on speed (slower speed = longer duration)
  const rotationDuration = 2 / speed;
  const fanColor = getSpeedColor(speed);

  return (
    <div className="fan-display">
      <h2>Fan Status</h2>

      <div className="fan-visual">
        <svg
          viewBox="0 0 100 100"
          className="fan-svg"
          style={{
            animation: `spin ${rotationDuration}s linear infinite`,
          }}
        >
          {/* Fan blades */}
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="50"
              cy="25"
              rx="12"
              ry="22"
              fill={fanColor}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.9"
            />
          ))}
          {/* Fan center hub */}
          <circle cx="50" cy="50" r="12" fill={fanColor} />
          <circle cx="50" cy="50" r="6" fill="#1a1a2e" />
        </svg>

        <div className="speed-label" style={{ color: fanColor }}>
          {getSpeedLabel(speed)}
        </div>
      </div>

      <SpeedIndicator speed={speed} />

      <div className="speed-info">
        <div className="info-item">
          <span className="info-label">Speed Level</span>
          <span className="info-value" style={{ color: fanColor }}>{speed}/5</span>
        </div>
        <div className="info-item">
          <span className="info-label">Estimated RPM</span>
          <span className="info-value">~{speed * 300}</span>
        </div>
      </div>
    </div>
  );
}
