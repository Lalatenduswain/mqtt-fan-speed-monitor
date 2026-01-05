import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';

const HomeContext = createContext(null);

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function HomeProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const wsUrl = getWebSocketUrl();
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(wsUrl);

  function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  // Fetch initial data from API
  const fetchData = useCallback(async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      const [roomsRes, devicesRes, scenesRes] = await Promise.all([
        fetch('/api/rooms', { headers }),
        fetch('/api/devices', { headers }),
        fetch('/api/scenes', { headers })
      ]);

      if (roomsRes.ok && devicesRes.ok && scenesRes.ok) {
        const [roomsData, devicesData, scenesData] = await Promise.all([
          roomsRes.json(),
          devicesRes.json(),
          scenesRes.json()
        ]);

        setRooms(roomsData);
        setDevices(devicesData);
        setScenes(scenesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const message = JSON.parse(lastMessage);

      switch (message.type) {
        case 'initial_state':
          setRooms(message.data.rooms || []);
          setDevices(message.data.devices || []);
          setScenes(message.data.scenes || []);
          setLoading(false);
          break;

        case 'device_update':
          setDevices(prev => prev.map(d =>
            d.id === message.device_id
              ? { ...d, state: { ...d.state, ...message.state }, is_online: true }
              : d
          ));
          break;

        case 'power_update':
          // Handle power updates if needed
          break;

        case 'environment_update':
          setRooms(prev => prev.map(r =>
            r.id === message.room_id
              ? { ...r, environment: { temperature: message.temperature, humidity: message.humidity } }
              : r
          ));
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [lastMessage]);

  // Control a device
  const controlDevice = useCallback(async (deviceId, command) => {
    // Optimistic update
    setDevices(prev => prev.map(d =>
      d.id === deviceId
        ? { ...d, state: { ...d.state, ...command } }
        : d
    ));

    // Send via WebSocket
    sendMessage(JSON.stringify({
      type: 'control_device',
      device_id: deviceId,
      command
    }));

    // Also send via REST API for persistence
    try {
      await fetch(`/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(command)
      });
    } catch (error) {
      console.error('Error controlling device:', error);
    }
  }, [sendMessage]);

  // Toggle a device
  const toggleDevice = useCallback((deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      controlDevice(deviceId, { on: !device.state.on });
    }
  }, [devices, controlDevice]);

  // Execute a scene
  const executeScene = useCallback(async (sceneId) => {
    sendMessage(JSON.stringify({
      type: 'execute_scene',
      scene_id: sceneId
    }));

    try {
      await fetch(`/api/scenes/${sceneId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error executing scene:', error);
    }
  }, [sendMessage]);

  // Get devices for a room
  const getDevicesByRoom = useCallback((roomId) => {
    return devices.filter(d => d.room_id === roomId);
  }, [devices]);

  // Get device by ID
  const getDevice = useCallback((deviceId) => {
    return devices.find(d => d.id === deviceId);
  }, [devices]);

  // Get room by ID
  const getRoom = useCallback((roomId) => {
    return rooms.find(r => r.id === roomId);
  }, [rooms]);

  const value = {
    rooms,
    devices,
    scenes,
    loading,
    connectionStatus,
    controlDevice,
    toggleDevice,
    executeScene,
    getDevicesByRoom,
    getDevice,
    getRoom,
    refreshData: fetchData,
    refreshState: () => sendMessage(JSON.stringify({ type: 'get_state' }))
  };

  return (
    <HomeContext.Provider value={value}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHome() {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
}
