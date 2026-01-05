import { useState, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const ROOM_ICONS = ['🛋️', '🛏️', '🍳', '🚿', '🏠', '🌳', '🚗', '👶', '💼', '🎮'];
const DEVICE_TYPES = [
  { value: 'light', label: 'Light', icon: '💡' },
  { value: 'fan', label: 'Fan', icon: '🌀' },
  { value: 'ac', label: 'Air Conditioner', icon: '❄️' },
  { value: 'tv', label: 'Television', icon: '📺' },
  { value: 'switch', label: 'Smart Switch', icon: '🔌' },
  { value: 'sensor', label: 'Sensor', icon: '📡' },
];
const USER_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'user', label: 'User', description: 'Can control devices and view data' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export default function Settings() {
  const { rooms, devices, refreshData } = useHome();
  const { user: currentUser, isAdmin, changePassword } = useAuth();

  // Users state (admin only)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('homePreferences');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      tempUnit: 'celsius',
      currency: 'INR',
      electricityRate: 8,
      notifications: true,
      soundEffects: true,
      compactView: false,
    };
  });

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [roomForm, setRoomForm] = useState({ name: '', icon: '🛋️' });
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: 'light',
    room_id: '',
    mqtt_topic: ''
  });
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    display_name: '',
    role: 'user',
    is_active: true
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch users if admin
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/auth/users', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const savePreferences = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('homePreferences', JSON.stringify(updated));
  };

  // Room handlers
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({ name: '', icon: '🛋️' });
    setShowRoomModal(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({ name: room.name, icon: room.icon || '🛋️' });
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!roomForm.name.trim()) return;

    try {
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(roomForm)
      });

      if (response.ok) {
        refreshData();
        setShowRoomModal(false);
      }
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Delete this room? All devices in this room will be unassigned.')) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        refreshData();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  // Device handlers
  const openAddDevice = () => {
    setEditingDevice(null);
    setDeviceForm({
      name: '',
      type: 'light',
      room_id: rooms[0]?.id || '',
      mqtt_topic: ''
    });
    setShowDeviceModal(true);
  };

  const openEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceForm({
      name: device.name,
      type: device.type,
      room_id: device.room_id,
      mqtt_topic: device.mqtt_topic || ''
    });
    setShowDeviceModal(true);
  };

  const handleSaveDevice = async () => {
    if (!deviceForm.name.trim() || !deviceForm.room_id) return;

    try {
      const url = editingDevice ? `/api/devices/${editingDevice.id}` : '/api/devices';
      const method = editingDevice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(deviceForm)
      });

      if (response.ok) {
        refreshData();
        setShowDeviceModal(false);
      }
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!confirm('Delete this device? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        refreshData();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  // User handlers
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      password: '',
      email: '',
      display_name: '',
      role: 'user',
      is_active: true
    });
    setShowUserModal(true);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      display_name: user.display_name || '',
      role: user.role,
      is_active: !!user.is_active
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) return;
    if (!editingUser && !userForm.password) return;

    try {
      const url = editingUser ? `/api/auth/users/${editingUser.id}` : '/api/auth/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload = editingUser
        ? {
            display_name: userForm.display_name,
            email: userForm.email || null,
            role: userForm.role,
            is_active: userForm.is_active
          }
        : userForm;

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !user.is_active })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Password change handler
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    const result = await changePassword(passwordForm.current_password, passwordForm.new_password);

    if (result.success) {
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } else {
      setPasswordError(result.error || 'Failed to change password');
    }
  };

  const handleClearData = async () => {
    if (!confirm('This will reset all settings to defaults. Continue?')) return;
    localStorage.removeItem('homePreferences');
    setPreferences({
      theme: 'dark',
      tempUnit: 'celsius',
      currency: 'INR',
      electricityRate: 8,
      notifications: true,
      soundEffects: true,
      compactView: false,
    });
  };

  const getDeviceIcon = (type) => {
    return DEVICE_TYPES.find(t => t.value === type)?.icon || '📱';
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'user': return 'badge-user';
      case 'viewer': return 'badge-viewer';
      default: return '';
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <h1>Settings</h1>
        <p>Manage your smart home preferences</p>
      </header>

      <div className="settings-sections">
        {/* Account Section */}
        <section className="settings-section">
          <div className="section-header">
            <span className="section-icon">👤</span>
            <h2>Account</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Username</p>
              <p className="setting-description">{currentUser?.username}</p>
            </div>
            <div className="setting-control">
              <span className={`role-badge ${getRoleBadgeClass(currentUser?.role)}`}>
                {currentUser?.role}
              </span>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Display Name</p>
              <p className="setting-description">{currentUser?.display_name || currentUser?.username}</p>
            </div>
          </div>

          <div className="setting-item clickable" onClick={() => setShowPasswordModal(true)}>
            <div className="setting-info">
              <p className="setting-label">Change Password</p>
              <p className="setting-description">Update your account password</p>
            </div>
            <span className="arrow">→</span>
          </div>
        </section>

        {/* Users Section (Admin Only) */}
        {isAdmin && (
          <section className="settings-section">
            <div className="section-header">
              <span className="section-icon">👥</span>
              <h2>Users ({users.length})</h2>
            </div>

            <div className="items-list">
              {loadingUsers ? (
                <div className="list-item">
                  <p style={{ color: '#6b7280', padding: '8px 0' }}>Loading users...</p>
                </div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-icon user-avatar-small">
                        {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                      </div>
                      <div className="list-item-text">
                        <h3>
                          {user.display_name || user.username}
                          {user.id === currentUser?.id && <span className="you-badge">You</span>}
                        </h3>
                        <p>
                          @{user.username} •
                          <span className={`role-badge-small ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="list-item-actions">
                      <div
                        className={`toggle-switch small ${user.is_active ? 'active' : ''}`}
                        onClick={() => user.id !== currentUser?.id && handleToggleUserStatus(user)}
                        title={user.is_active ? 'Active' : 'Disabled'}
                        style={{ opacity: user.id === currentUser?.id ? 0.5 : 1 }}
                      />
                      <button className="icon-btn" onClick={() => openEditUser(user)}>✏️</button>
                      {user.id !== currentUser?.id && (
                        <button className="icon-btn danger" onClick={() => handleDeleteUser(user.id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="add-item-btn" onClick={openAddUser}>
              + Add User
            </button>
          </section>
        )}

        {/* Preferences Section */}
        <section className="settings-section">
          <div className="section-header">
            <span className="section-icon">⚙️</span>
            <h2>Preferences</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Temperature Unit</p>
              <p className="setting-description">Display temperature in Celsius or Fahrenheit</p>
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={preferences.tempUnit}
                onChange={(e) => savePreferences('tempUnit', e.target.value)}
              >
                <option value="celsius">Celsius</option>
                <option value="fahrenheit">Fahrenheit</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Currency</p>
              <p className="setting-description">For energy cost calculations</p>
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={preferences.currency}
                onChange={(e) => savePreferences('currency', e.target.value)}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Electricity Rate</p>
              <p className="setting-description">Cost per kWh in your area</p>
            </div>
            <div className="setting-control">
              <input
                type="number"
                className="setting-input"
                value={preferences.electricityRate}
                onChange={(e) => savePreferences('electricityRate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Notifications</p>
              <p className="setting-description">Receive alerts for device status changes</p>
            </div>
            <div className="setting-control">
              <div
                className={`toggle-switch ${preferences.notifications ? 'active' : ''}`}
                onClick={() => savePreferences('notifications', !preferences.notifications)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Sound Effects</p>
              <p className="setting-description">Play sounds when controlling devices</p>
            </div>
            <div className="setting-control">
              <div
                className={`toggle-switch ${preferences.soundEffects ? 'active' : ''}`}
                onClick={() => savePreferences('soundEffects', !preferences.soundEffects)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Compact View</p>
              <p className="setting-description">Show smaller device cards on dashboard</p>
            </div>
            <div className="setting-control">
              <div
                className={`toggle-switch ${preferences.compactView ? 'active' : ''}`}
                onClick={() => savePreferences('compactView', !preferences.compactView)}
              />
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="settings-section">
          <div className="section-header">
            <span className="section-icon">🏠</span>
            <h2>Rooms ({rooms.length})</h2>
          </div>

          <div className="items-list">
            {rooms.map(room => {
              const roomDevices = devices.filter(d => d.room_id === room.id);
              return (
                <div key={room.id} className="list-item">
                  <div className="list-item-info">
                    <div className="list-item-icon">{room.icon || '🏠'}</div>
                    <div className="list-item-text">
                      <h3>{room.name}</h3>
                      <p>{roomDevices.length} device{roomDevices.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <button className="icon-btn" onClick={() => openEditRoom(room)}>✏️</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteRoom(room.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="add-item-btn" onClick={openAddRoom}>
            + Add Room
          </button>
        </section>

        {/* Devices Section */}
        <section className="settings-section">
          <div className="section-header">
            <span className="section-icon">📱</span>
            <h2>Devices ({devices.length})</h2>
          </div>

          <div className="items-list">
            {devices.map(device => {
              const room = rooms.find(r => r.id === device.room_id);
              return (
                <div key={device.id} className="list-item">
                  <div className="list-item-info">
                    <div className="list-item-icon">{getDeviceIcon(device.type)}</div>
                    <div className="list-item-text">
                      <h3>{device.name}</h3>
                      <p>{room?.name || 'No room'} • {device.type}</p>
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <span className={`status-dot ${device.is_online ? 'online' : 'offline'}`} />
                    <button className="icon-btn" onClick={() => openEditDevice(device)}>✏️</button>
                    <button className="icon-btn danger" onClick={() => handleDeleteDevice(device.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="add-item-btn" onClick={openAddDevice}>
            + Add Device
          </button>
        </section>

        {/* System Section */}
        <section className="settings-section">
          <div className="section-header">
            <span className="section-icon">🔧</span>
            <h2>System</h2>
          </div>

          <div className="setting-item clickable" onClick={() => refreshData()}>
            <div className="setting-info">
              <p className="setting-label">Refresh Data</p>
              <p className="setting-description">Sync devices and rooms from server</p>
            </div>
            <span className="arrow">→</span>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">MQTT Broker</p>
              <p className="setting-description">Connection status</p>
            </div>
            <div className="setting-control">
              <span className="setting-value" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="status-dot online" />
                Connected
              </span>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Active Schedules</p>
              <p className="setting-description">Automation schedules running</p>
            </div>
            <div className="setting-control">
              <span className="setting-value">View in Schedules</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section danger-zone">
          <div className="section-header">
            <span className="section-icon">⚠️</span>
            <h2>Danger Zone</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <p className="setting-label">Reset Preferences</p>
              <p className="setting-description">Clear all saved preferences</p>
            </div>
            <div className="setting-control">
              <button className="danger-btn" onClick={handleClearData}>
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section">
          <div className="about-info">
            <div className="app-logo">🏠</div>
            <h3>LaLa Home</h3>
            <p className="version">Version 1.0.0</p>
            <div className="about-links">
              <span className="about-link">Documentation</span>
              <span className="about-link">GitHub</span>
              <span className="about-link">Support</span>
            </div>
          </div>
        </section>
      </div>

      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="e.g., Living Room"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {ROOM_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${roomForm.icon === icon ? 'selected' : ''}`}
                      onClick={() => setRoomForm({ ...roomForm, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRoomModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveRoom}>
                {editingRoom ? 'Save' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Modal */}
      {showDeviceModal && (
        <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDevice ? 'Edit Device' : 'Add Device'}</h2>
              <button className="modal-close" onClick={() => setShowDeviceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Device Name</label>
                <input
                  type="text"
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                  placeholder="e.g., Ceiling Fan"
                />
              </div>
              <div className="form-group">
                <label>Device Type</label>
                <select
                  value={deviceForm.type}
                  onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
                >
                  {DEVICE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Room</label>
                <select
                  value={deviceForm.room_id}
                  onChange={(e) => setDeviceForm({ ...deviceForm, room_id: e.target.value })}
                >
                  <option value="">Select a room...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.icon} {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>MQTT Topic (Optional)</label>
                <input
                  type="text"
                  value={deviceForm.mqtt_topic}
                  onChange={(e) => setDeviceForm({ ...deviceForm, mqtt_topic: e.target.value })}
                  placeholder="e.g., home/living_room/fan"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeviceModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveDevice}>
                {editingDevice ? 'Save' : 'Add Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g., john_doe"
                  disabled={!!editingUser}
                  style={{ opacity: editingUser ? 0.6 : 1 }}
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={userForm.display_name}
                  onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <div className="role-selector">
                  {USER_ROLES.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      className={`role-option ${userForm.role === role.value ? 'selected' : ''}`}
                      onClick={() => setUserForm({ ...userForm, role: role.value })}
                    >
                      <span className="role-name">{role.label}</span>
                      <span className="role-desc">{role.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              {editingUser && (
                <div className="form-group">
                  <label>Status</label>
                  <div
                    className="status-toggle"
                    onClick={() => setUserForm({ ...userForm, is_active: !userForm.is_active })}
                  >
                    <div className={`toggle-switch ${userForm.is_active ? 'active' : ''}`} />
                    <span>{userForm.is_active ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveUser}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <div className="form-error">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="form-success">{passwordSuccess}</div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
