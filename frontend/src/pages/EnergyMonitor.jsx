import { useState, useEffect, useMemo } from 'react';
import { useHome } from '../context/HomeContext';
import BarChart from '../components/Charts/BarChart';
import LineChart from '../components/Charts/LineChart';
import DonutChart from '../components/Charts/DonutChart';
import './EnergyMonitor.css';

// Get preferences from localStorage
function getPreferences() {
  const saved = localStorage.getItem('homePreferences');
  return saved ? JSON.parse(saved) : { currency: 'INR', electricityRate: 8 };
}

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export default function EnergyMonitor() {
  const { devices, rooms } = useHome();
  const [timeRange, setTimeRange] = useState('today');
  const [powerData, setPowerData] = useState(null);
  const [loading, setLoading] = useState(true);

  const prefs = getPreferences();
  const ELECTRICITY_RATE = prefs.electricityRate || 8;
  const CURRENCY = CURRENCY_SYMBOLS[prefs.currency] || '₹';

  // Fetch power data from API
  useEffect(() => {
    fetchPowerData();
    const interval = setInterval(fetchPowerData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPowerData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/power/summary', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setPowerData(data);
      }
    } catch (error) {
      console.error('Error fetching power data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current power consumption
  const currentPower = useMemo(() => {
    if (!powerData) return 85 + Math.random() * 50; // Mock for demo
    return powerData.current_power_watts || 0;
  }, [powerData]);

  // Generate hourly data
  const hourlyData = useMemo(() => {
    const hours = timeRange === 'today' ? 24 : timeRange === 'week' ? 168 : 720;
    const data = [];
    const now = new Date();

    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now - i * 3600000);
      const baseLoad = 60 + Math.random() * 40;
      const hour = time.getHours();
      // Peak hours simulation
      let multiplier = 1;
      if (hour >= 7 && hour <= 9) multiplier = 1.5;
      else if (hour >= 18 && hour <= 22) multiplier = 2.2;
      else if (hour >= 0 && hour <= 5) multiplier = 0.6;

      const value = baseLoad * multiplier + Math.random() * 30;

      let label;
      if (timeRange === 'today') {
        label = hour.toString().padStart(2, '0') + ':00';
      } else if (timeRange === 'week') {
        label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][time.getDay()];
      } else {
        label = time.getDate().toString();
      }

      data.push({ label, value, time });
    }
    return data;
  }, [timeRange]);

  // Aggregate for bar chart
  const aggregatedData = useMemo(() => {
    if (timeRange === 'today') {
      return hourlyData.slice(-24);
    } else if (timeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map(day => {
        const dayData = hourlyData.filter(d => d.label === day);
        const avgValue = dayData.reduce((sum, d) => sum + d.value, 0) / (dayData.length || 1);
        return { label: day, value: avgValue };
      });
    } else {
      const weeks = [];
      for (let i = 0; i < 4; i++) {
        const weekData = hourlyData.slice(i * 168, (i + 1) * 168);
        const avgValue = weekData.reduce((sum, d) => sum + d.value, 0) / (weekData.length || 1);
        weeks.push({ label: `Week ${i + 1}`, value: avgValue });
      }
      return weeks;
    }
  }, [hourlyData, timeRange]);

  // Device power breakdown
  const deviceBreakdown = useMemo(() => {
    const activeDevices = devices.filter(d => d.state?.on);
    if (activeDevices.length === 0) {
      return [
        { label: 'Standby Load', value: 15, color: '#6b7280' },
        { label: 'Network Devices', value: 8, color: '#9ca3af' }
      ];
    }

    return activeDevices.map(device => {
      let power = 5;
      if (device.type === 'light') power = 8 + Math.random() * 12;
      else if (device.type === 'fan') power = 25 + (device.state?.speed || 3) * 12;
      else if (device.type === 'ac') power = 900 + Math.random() * 500;
      else if (device.type === 'tv') power = 60 + Math.random() * 50;
      else if (device.type === 'appliance') power = 40 + Math.random() * 80;

      return { label: device.name, value: power, deviceId: device.id, type: device.type };
    });
  }, [devices]);

  // Room breakdown
  const roomBreakdown = useMemo(() => {
    const roomPower = {};
    deviceBreakdown.forEach(device => {
      const deviceInfo = devices.find(d => d.id === device.deviceId);
      if (deviceInfo) {
        const room = rooms.find(r => r.id === deviceInfo.room_id);
        const roomName = room?.name || 'Other';
        roomPower[roomName] = (roomPower[roomName] || 0) + device.value;
      } else if (!device.deviceId) {
        roomPower['Standby'] = (roomPower['Standby'] || 0) + device.value;
      }
    });
    return Object.entries(roomPower).map(([label, value]) => ({ label, value }));
  }, [deviceBreakdown, devices, rooms]);

  // Statistics
  const stats = useMemo(() => {
    const avgPower = hourlyData.reduce((sum, d) => sum + d.value, 0) / hourlyData.length;
    const maxPower = Math.max(...hourlyData.map(d => d.value));
    const minPower = Math.min(...hourlyData.map(d => d.value));
    const hoursInRange = timeRange === 'today' ? 24 : timeRange === 'week' ? 168 : 720;
    const totalKwh = (avgPower * hoursInRange) / 1000;
    const totalCost = totalKwh * ELECTRICITY_RATE;
    const monthlyEstimate = (avgPower * 720) / 1000;
    const monthlyCost = monthlyEstimate * ELECTRICITY_RATE;
    const carbonKg = totalKwh * 0.82; // Average CO2 per kWh

    return {
      current: currentPower,
      average: avgPower,
      max: maxPower,
      min: minPower,
      totalKwh,
      totalCost,
      monthlyEstimate,
      monthlyCost,
      carbonKg
    };
  }, [hourlyData, currentPower, timeRange, ELECTRICITY_RATE]);

  // Power level percentage (for gauge)
  const powerLevel = useMemo(() => {
    const maxExpected = 2000; // 2kW max
    return Math.min((currentPower / maxExpected) * 100, 100);
  }, [currentPower]);

  const getDeviceIcon = (type) => {
    const icons = { light: '💡', fan: '🌀', ac: '❄️', tv: '📺', appliance: '🔌' };
    return icons[type] || '⚡';
  };

  if (loading) {
    return (
      <div className="energy-monitor loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading energy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="energy-monitor">
      {/* Header */}
      <header className="energy-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Energy Monitor</h1>
            <p className="header-subtitle">Real-time power consumption</p>
          </div>
        </div>

        {/* Live Power Display */}
        <div className="live-power-card">
          <div className="power-gauge">
            <svg viewBox="0 0 120 70" className="gauge-svg">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${powerLevel * 1.57} 157`}
                className="gauge-fill"
              />
            </svg>
            <div className="gauge-value">
              <span className="gauge-number">{currentPower.toFixed(0)}</span>
              <span className="gauge-unit">W</span>
            </div>
            <div className="gauge-label">
              <span className="live-indicator"></span>
              Live Power
            </div>
          </div>
          <div className="power-stats-mini">
            <div className="mini-stat">
              <span className="mini-value">{stats.average.toFixed(0)}W</span>
              <span className="mini-label">Average</span>
            </div>
            <div className="mini-stat">
              <span className="mini-value">{stats.max.toFixed(0)}W</span>
              <span className="mini-label">Peak</span>
            </div>
            <div className="mini-stat">
              <span className="mini-value">{stats.min.toFixed(0)}W</span>
              <span className="mini-label">Min</span>
            </div>
          </div>
        </div>

        {/* Time Range */}
        <div className="time-range-selector">
          {['today', 'week', 'month'].map(range => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card usage">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalKwh.toFixed(1)}<small>kWh</small></span>
            <span className="stat-label">Total Usage</span>
          </div>
          <div className="stat-trend up">+12%</div>
        </div>

        <div className="stat-card cost">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{CURRENCY}{stats.totalCost.toFixed(0)}</span>
            <span className="stat-label">Estimated Cost</span>
          </div>
          <div className="stat-rate">@{CURRENCY}{ELECTRICITY_RATE}/kWh</div>
        </div>

        <div className="stat-card monthly">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{CURRENCY}{stats.monthlyCost.toFixed(0)}</span>
            <span className="stat-label">Monthly Estimate</span>
          </div>
          <div className="stat-sub">{stats.monthlyEstimate.toFixed(0)} kWh</div>
        </div>

        <div className="stat-card carbon">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <span className="stat-value">{stats.carbonKg.toFixed(1)}<small>kg</small></span>
            <span className="stat-label">CO₂ Footprint</span>
          </div>
        </div>
      </section>

      {/* Main Chart */}
      <section className="chart-card main-chart">
        <div className="chart-header">
          <div>
            <h2>Power Consumption</h2>
            <p className="chart-subtitle">
              {timeRange === 'today' ? 'Last 24 hours' : timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </p>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot green"></span>Low</span>
            <span className="legend-item"><span className="legend-dot yellow"></span>Medium</span>
            <span className="legend-item"><span className="legend-dot red"></span>High</span>
          </div>
        </div>
        <div className="chart-container large">
          <LineChart
            data={hourlyData.slice(-48)}
            height={220}
            color="#4ade80"
            showArea={true}
          />
        </div>
      </section>

      {/* Usage Pattern */}
      <section className="chart-card">
        <div className="chart-header">
          <h2>Usage Pattern</h2>
          <p className="chart-subtitle">
            {timeRange === 'today' ? 'Hourly breakdown' : timeRange === 'week' ? 'Daily average' : 'Weekly average'}
          </p>
        </div>
        <div className="chart-container">
          <BarChart
            data={aggregatedData.slice(-12)}
            height={160}
            color="#3b82f6"
          />
        </div>
      </section>

      {/* Breakdown Section */}
      <section className="breakdown-grid">
        <div className="breakdown-card">
          <h3>By Device</h3>
          <div className="donut-wrapper">
            <DonutChart
              data={deviceBreakdown}
              size={160}
              thickness={24}
            />
          </div>
          <div className="breakdown-legend">
            {deviceBreakdown.slice(0, 4).map((item, i) => (
              <div key={i} className="legend-row">
                <span className="legend-color" style={{ background: ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}></span>
                <span className="legend-name">{item.label}</span>
                <span className="legend-value">{item.value.toFixed(0)}W</span>
              </div>
            ))}
          </div>
        </div>

        <div className="breakdown-card">
          <h3>By Room</h3>
          <div className="donut-wrapper">
            <DonutChart
              data={roomBreakdown}
              size={160}
              thickness={24}
            />
          </div>
          <div className="breakdown-legend">
            {roomBreakdown.slice(0, 4).map((item, i) => (
              <div key={i} className="legend-row">
                <span className="legend-color" style={{ background: ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}></span>
                <span className="legend-name">{item.label}</span>
                <span className="legend-value">{item.value.toFixed(0)}W</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Devices */}
      <section className="devices-card">
        <div className="devices-header">
          <h2>Active Devices</h2>
          <span className="device-count">{deviceBreakdown.length} devices</span>
        </div>
        <div className="devices-list">
          {deviceBreakdown.map((device, index) => {
            const percentage = (device.value / Math.max(...deviceBreakdown.map(d => d.value))) * 100;
            return (
              <div key={index} className="device-row">
                <div className="device-info">
                  <span className="device-icon">{getDeviceIcon(device.type)}</span>
                  <span className="device-name">{device.label}</span>
                </div>
                <div className="device-bar-wrapper">
                  <div className="device-bar">
                    <div
                      className="device-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="device-power">{device.value.toFixed(0)}W</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="tips-section">
        <h2>Energy Saving Tips</h2>
        <div className="tips-carousel">
          <div className="tip-card">
            <div className="tip-icon-wrapper green">💡</div>
            <div className="tip-content">
              <h4>LED Lighting</h4>
              <p>Save up to 80% on lighting costs</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon-wrapper blue">❄️</div>
            <div className="tip-content">
              <h4>Optimal AC Temp</h4>
              <p>Set to 24-25°C for efficiency</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon-wrapper yellow">🔌</div>
            <div className="tip-content">
              <h4>Standby Power</h4>
              <p>Unplug devices when not in use</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon-wrapper purple">⏰</div>
            <div className="tip-content">
              <h4>Smart Schedules</h4>
              <p>Automate device shutoff times</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
