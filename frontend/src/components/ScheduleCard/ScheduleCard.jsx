import { useState } from 'react';
import './ScheduleCard.css';

// Parse cron expression to human readable format
function parseCronToHuman(cron) {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Time
  const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  // Days
  let daysStr = '';
  if (dayOfWeek === '*') {
    daysStr = 'Every day';
  } else {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)] || d);
    daysStr = days.join(', ');
  }

  return { time: timeStr, days: daysStr };
}

// Get action description
function getActionDescription(action) {
  if (!action) return 'Unknown action';

  const parts = [];
  if (action.on !== undefined) {
    parts.push(action.on ? 'Turn ON' : 'Turn OFF');
  }
  if (action.speed !== undefined) {
    parts.push(`Speed ${action.speed}`);
  }
  if (action.temp !== undefined) {
    parts.push(`${action.temp}°C`);
  }
  if (action.mode !== undefined) {
    parts.push(`Mode: ${action.mode}`);
  }

  return parts.join(', ') || 'Custom action';
}

export default function ScheduleCard({ schedule, onToggle, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const cronInfo = parseCronToHuman(schedule.cron_expression);
  const actionDesc = getActionDescription(schedule.action);

  const handleToggle = () => {
    onToggle(schedule.id, !schedule.enabled);
  };

  return (
    <div className={`schedule-card ${schedule.enabled ? 'enabled' : 'disabled'}`}>
      <div className="schedule-main">
        <div className="schedule-time">
          <span className="time">{cronInfo.time}</span>
          <span className="days">{cronInfo.days}</span>
        </div>

        <div className="schedule-info">
          <h3 className="schedule-name">{schedule.name}</h3>
          <p className="schedule-device">
            {schedule.device_name || schedule.device_id}
            {schedule.room_name && <span className="room-badge">{schedule.room_name}</span>}
          </p>
          <p className="schedule-action">{actionDesc}</p>
        </div>

        <div className="schedule-controls">
          <button
            className={`toggle-btn ${schedule.enabled ? 'on' : 'off'}`}
            onClick={handleToggle}
            aria-label={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
          >
            <div className="toggle-slider" />
          </button>

          <div className="menu-container">
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              ⋮
            </button>

            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="menu-dropdown">
                  <button onClick={() => { onEdit(schedule); setShowMenu(false); }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => { onDelete(schedule.id); setShowMenu(false); }} className="danger">
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {schedule.last_run && (
        <div className="schedule-footer">
          <span className="last-run">
            Last run: {new Date(schedule.last_run).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
