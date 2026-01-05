import { getSpeedColor } from '../../utils/colorUtils';
import './FanController.css';

export default function FanController({ speed, onSpeedChange }) {
  const speedLabels = ['Very Slow', 'Slow', 'Medium', 'Fast', 'Very Fast'];

  return (
    <div className="fan-controller">
      <h2>Speed Controller</h2>

      <div className="slider-section">
        <div className="slider-container">
          <input
            type="range"
            min="1"
            max="5"
            value={speed}
            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
            className="speed-slider"
            style={{
              background: `linear-gradient(to right, ${getSpeedColor(1)} 0%, ${getSpeedColor(speed)} ${((speed - 1) / 4) * 100}%, #3a3a4a ${((speed - 1) / 4) * 100}%, #3a3a4a 100%)`,
            }}
          />
        </div>
        <div className="speed-marks">
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={speed === level ? 'active' : ''}
              style={{ color: speed === level ? getSpeedColor(level) : '#666' }}
            >
              {level}
            </span>
          ))}
        </div>
      </div>

      <div className="buttons-section">
        <p className="section-label">Quick Select</p>
        <div className="speed-buttons">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => onSpeedChange(level)}
              className={speed === level ? 'active' : ''}
              style={{
                backgroundColor: speed === level ? getSpeedColor(level) : 'transparent',
                borderColor: getSpeedColor(level),
                color: speed === level ? '#fff' : getSpeedColor(level),
              }}
            >
              {speedLabels[level - 1]}
            </button>
          ))}
        </div>
      </div>

      <div className="current-display">
        <span className="label">Current Speed:</span>
        <span className="value" style={{ color: getSpeedColor(speed) }}>
          {speed}
        </span>
      </div>
    </div>
  );
}
