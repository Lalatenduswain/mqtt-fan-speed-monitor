import { useState, useEffect, useMemo } from 'react';
import FanController from './components/FanController/FanController';
import FanDisplay from './components/FanDisplay/FanDisplay';
import useWebSocket from './hooks/useWebSocket';

function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

function App() {
  const [speed, setSpeed] = useState(1);
  const wsUrl = useMemo(() => getWebSocketUrl(), []);
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'speed_update' || data.type === 'initial_state') {
          setSpeed(data.speed);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  }, [lastMessage]);

  const handleSpeedChange = (newSpeed) => {
    sendMessage(JSON.stringify({ type: 'set_speed', speed: newSpeed }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fan Speed Monitor</h1>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-dot"></span>
          {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      <main className="app-main">
        <FanController speed={speed} onSpeedChange={handleSpeedChange} />
        <FanDisplay speed={speed} />
      </main>
      <footer className="app-footer">
        <p>MQTT-based IoT Fan Speed Monitoring System</p>
      </footer>
    </div>
  );
}

export default App;
