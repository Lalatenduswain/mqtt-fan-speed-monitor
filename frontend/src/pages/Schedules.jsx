import { useState, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import ScheduleCard from '../components/ScheduleCard/ScheduleCard';
import ScheduleForm from '../components/ScheduleForm/ScheduleForm';
import './Schedules.css';

export default function Schedules() {
  const { devices } = useHome();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filter, setFilter] = useState('all'); // all, enabled, disabled

  // Fetch schedules from API
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (scheduleId, enabled) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/toggle`, {
        method: 'POST'
      });

      if (response.ok) {
        setSchedules(prev =>
          prev.map(s => s.id === scheduleId ? { ...s, enabled } : s)
        );
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleSave = async (scheduleData) => {
    try {
      const isEditing = !!scheduleData.id;
      const url = isEditing ? `/api/schedules/${scheduleData.id}` : '/api/schedules';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        const saved = await response.json();

        if (isEditing) {
          setSchedules(prev => prev.map(s => s.id === saved.id ? saved : s));
        } else {
          setSchedules(prev => [...prev, saved]);
        }

        setShowForm(false);
        setEditingSchedule(null);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
  };

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'enabled') return schedule.enabled;
    if (filter === 'disabled') return !schedule.enabled;
    return true;
  });

  // Group schedules by device type or room
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const device = devices.find(d => d.id === schedule.device_id);
    const groupKey = device?.room_name || 'Other';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(schedule);
    return acc;
  }, {});

  const enabledCount = schedules.filter(s => s.enabled).length;

  if (loading) {
    return (
      <div className="schedules-page loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedules-page">
      {/* Header */}
      <header className="schedules-header">
        <div className="header-content">
          <h1>Schedules</h1>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add
          </button>
        </div>

        <div className="header-stats">
          <span className="stat">
            <strong>{enabledCount}</strong> active
          </span>
          <span className="stat">
            <strong>{schedules.length}</strong> total
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'enabled', label: 'Active' },
            { key: 'disabled', label: 'Inactive' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏰</div>
          <h3>No schedules yet</h3>
          <p>Create your first schedule to automate your devices</p>
          <button className="create-btn" onClick={() => setShowForm(true)}>
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="schedules-list">
          {Object.entries(groupedSchedules).map(([groupName, groupSchedules]) => (
            <div key={groupName} className="schedule-group">
              <h2 className="group-title">{groupName}</h2>
              <div className="group-schedules">
                {groupSchedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Schedules</h2>
        <div className="quick-templates">
          <button
            className="template-btn"
            onClick={() => {
              setEditingSchedule({
                name: 'Morning Lights',
                device_id: devices.find(d => d.type === 'light')?.id || '',
                cron_expression: '0 6 * * 1,2,3,4,5',
                action: { on: true },
                enabled: true
              });
              setShowForm(true);
            }}
          >
            <span className="template-icon">🌅</span>
            <span className="template-name">Morning Lights</span>
            <span className="template-desc">6:00 AM Weekdays</span>
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setEditingSchedule({
                name: 'Evening Lights',
                device_id: devices.find(d => d.type === 'light')?.id || '',
                cron_expression: '0 18 * * *',
                action: { on: true },
                enabled: true
              });
              setShowForm(true);
            }}
          >
            <span className="template-icon">🌆</span>
            <span className="template-name">Evening Lights</span>
            <span className="template-desc">6:00 PM Daily</span>
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setEditingSchedule({
                name: 'Night AC',
                device_id: devices.find(d => d.type === 'ac')?.id || '',
                cron_expression: '0 22 * * *',
                action: { on: true, temp: 25, mode: 'cool' },
                enabled: true
              });
              setShowForm(true);
            }}
          >
            <span className="template-icon">🌙</span>
            <span className="template-name">Night AC</span>
            <span className="template-desc">10:00 PM, 25°C</span>
          </button>

          <button
            className="template-btn"
            onClick={() => {
              setEditingSchedule({
                name: 'All Off',
                device_id: devices[0]?.id || '',
                cron_expression: '0 23 * * *',
                action: { on: false },
                enabled: true
              });
              setShowForm(true);
            }}
          >
            <span className="template-icon">💤</span>
            <span className="template-name">Sleep Mode</span>
            <span className="template-desc">11:00 PM All Off</span>
          </button>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <ScheduleForm
          schedule={editingSchedule}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
