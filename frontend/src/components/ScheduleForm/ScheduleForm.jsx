import { useState, useEffect } from 'react';
import { useHome } from '../../context/HomeContext';
import './ScheduleForm.css';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sun', short: 'S' },
  { value: '1', label: 'Mon', short: 'M' },
  { value: '2', label: 'Tue', short: 'T' },
  { value: '3', label: 'Wed', short: 'W' },
  { value: '4', label: 'Thu', short: 'T' },
  { value: '5', label: 'Fri', short: 'F' },
  { value: '6', label: 'Sat', short: 'S' },
];

const PRESET_TIMES = [
  { label: 'Sunrise', time: '06:00' },
  { label: 'Morning', time: '08:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '22:00' },
  { label: 'Midnight', time: '00:00' },
];

export default function ScheduleForm({ schedule, onSave, onClose }) {
  const { devices, rooms } = useHome();
  const isEditing = !!schedule;

  const [formData, setFormData] = useState({
    name: '',
    device_id: '',
    time: '18:00',
    days: ['1', '2', '3', '4', '5'], // Weekdays by default
    action: 'on',
    actionParams: {
      speed: 3,
      temp: 24,
      mode: 'cool'
    },
    enabled: true
  });

  const [errors, setErrors] = useState({});

  // Initialize form with existing schedule data
  useEffect(() => {
    if (schedule) {
      const cronParts = schedule.cron_expression.split(' ');
      const [minute, hour, , , dayOfWeek] = cronParts;

      setFormData({
        name: schedule.name,
        device_id: schedule.device_id,
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        days: dayOfWeek === '*' ? ['0', '1', '2', '3', '4', '5', '6'] : dayOfWeek.split(','),
        action: schedule.action.on === false ? 'off' : 'on',
        actionParams: {
          speed: schedule.action.speed || 3,
          temp: schedule.action.temp || 24,
          mode: schedule.action.mode || 'cool'
        },
        enabled: schedule.enabled
      });
    }
  }, [schedule]);

  const selectedDevice = devices.find(d => d.id === formData.device_id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort();
      return { ...prev, days };
    });
  };

  const handleParamChange = (param, value) => {
    setFormData(prev => ({
      ...prev,
      actionParams: { ...prev.actionParams, [param]: value }
    }));
  };

  const selectAllDays = () => {
    setFormData(prev => ({ ...prev, days: ['0', '1', '2', '3', '4', '5', '6'] }));
  };

  const selectWeekdays = () => {
    setFormData(prev => ({ ...prev, days: ['1', '2', '3', '4', '5'] }));
  };

  const selectWeekends = () => {
    setFormData(prev => ({ ...prev, days: ['0', '6'] }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.device_id) {
      newErrors.device_id = 'Please select a device';
    }
    if (formData.days.length === 0) {
      newErrors.days = 'Select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Build cron expression
    const [hour, minute] = formData.time.split(':');
    const daysStr = formData.days.length === 7 ? '*' : formData.days.join(',');
    const cronExpression = `${parseInt(minute)} ${parseInt(hour)} * * ${daysStr}`;

    // Build action object
    let action = { on: formData.action === 'on' };

    if (formData.action === 'on' && selectedDevice) {
      if (selectedDevice.type === 'fan') {
        action.speed = formData.actionParams.speed;
      } else if (selectedDevice.type === 'ac') {
        action.temp = formData.actionParams.temp;
        action.mode = formData.actionParams.mode;
      }
    }

    const scheduleData = {
      name: formData.name.trim(),
      device_id: formData.device_id,
      cron_expression: cronExpression,
      action,
      enabled: formData.enabled
    };

    if (schedule) {
      scheduleData.id = schedule.id;
    }

    onSave(scheduleData);
  };

  // Group devices by room
  const devicesByRoom = devices.reduce((acc, device) => {
    const room = rooms.find(r => r.id === device.room_id);
    const roomName = room?.name || 'Other';
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push(device);
    return acc;
  }, {});

  return (
    <div className="schedule-form-overlay" onClick={onClose}>
      <div className="schedule-form-modal" onClick={e => e.stopPropagation()}>
        <div className="form-header">
          <h2>{isEditing ? 'Edit Schedule' : 'New Schedule'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Schedule Name */}
          <div className="form-group">
            <label>Schedule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g., Evening lights on"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          {/* Device Selection */}
          <div className="form-group">
            <label>Device</label>
            <select
              value={formData.device_id}
              onChange={e => handleChange('device_id', e.target.value)}
              className={errors.device_id ? 'error' : ''}
            >
              <option value="">Select a device...</option>
              {Object.entries(devicesByRoom).map(([roomName, roomDevices]) => (
                <optgroup key={roomName} label={roomName}>
                  {roomDevices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.device_id && <span className="error-text">{errors.device_id}</span>}
          </div>

          {/* Time Selection */}
          <div className="form-group">
            <label>Time</label>
            <div className="time-input-group">
              <input
                type="time"
                value={formData.time}
                onChange={e => handleChange('time', e.target.value)}
                className="time-input"
              />
              <div className="preset-times">
                {PRESET_TIMES.map(preset => (
                  <button
                    key={preset.time}
                    type="button"
                    className={`preset-btn ${formData.time === preset.time ? 'active' : ''}`}
                    onClick={() => handleChange('time', preset.time)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day Selection */}
          <div className="form-group">
            <label>Repeat</label>
            <div className="days-selection">
              <div className="days-grid">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`day-btn ${formData.days.includes(day.value) ? 'active' : ''}`}
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              <div className="days-presets">
                <button type="button" onClick={selectAllDays}>Every day</button>
                <button type="button" onClick={selectWeekdays}>Weekdays</button>
                <button type="button" onClick={selectWeekends}>Weekends</button>
              </div>
            </div>
            {errors.days && <span className="error-text">{errors.days}</span>}
          </div>

          {/* Action Selection */}
          <div className="form-group">
            <label>Action</label>
            <div className="action-buttons">
              <button
                type="button"
                className={`action-btn ${formData.action === 'on' ? 'active on' : ''}`}
                onClick={() => handleChange('action', 'on')}
              >
                Turn ON
              </button>
              <button
                type="button"
                className={`action-btn ${formData.action === 'off' ? 'active off' : ''}`}
                onClick={() => handleChange('action', 'off')}
              >
                Turn OFF
              </button>
            </div>
          </div>

          {/* Device-specific settings */}
          {formData.action === 'on' && selectedDevice && (
            <>
              {selectedDevice.type === 'fan' && (
                <div className="form-group">
                  <label>Fan Speed</label>
                  <div className="speed-selector">
                    {[1, 2, 3, 4, 5].map(speed => (
                      <button
                        key={speed}
                        type="button"
                        className={`speed-btn ${formData.actionParams.speed === speed ? 'active' : ''}`}
                        onClick={() => handleParamChange('speed', speed)}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDevice.type === 'ac' && (
                <>
                  <div className="form-group">
                    <label>Temperature</label>
                    <div className="temp-selector">
                      <button
                        type="button"
                        onClick={() => handleParamChange('temp', Math.max(16, formData.actionParams.temp - 1))}
                      >
                        -
                      </button>
                      <span className="temp-value">{formData.actionParams.temp}°C</span>
                      <button
                        type="button"
                        onClick={() => handleParamChange('temp', Math.min(30, formData.actionParams.temp + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mode</label>
                    <div className="mode-selector">
                      {['cool', 'fan', 'dry', 'auto'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          className={`mode-btn ${formData.actionParams.mode === mode ? 'active' : ''}`}
                          onClick={() => handleParamChange('mode', mode)}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {isEditing ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
