import { useMemo } from 'react';
import './Charts.css';

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DonutChart({ data, size = 200, thickness = 30 }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let currentAngle = -90; // Start from top
    const segments = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate SVG arc path
      const radius = 50 - thickness / 2;
      const startX = 50 + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = 50 + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = 50 + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = 50 + radius * Math.sin((endAngle * Math.PI) / 180);
      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;

      return {
        ...item,
        percentage,
        path,
        color: item.color || COLORS[index % COLORS.length]
      };
    });

    return { segments, total };
  }, [data, thickness]);

  if (!chartData) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="donut-chart-svg">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={50 - thickness / 2}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={thickness}
        />

        {/* Segments */}
        {chartData.segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="donut-segment"
          >
            <title>{`${segment.label}: ${segment.value.toFixed(1)}W (${segment.percentage.toFixed(1)}%)`}</title>
          </path>
        ))}
      </svg>

      {/* Center text */}
      <div className="donut-center">
        <span className="donut-total">{chartData.total.toFixed(0)}</span>
        <span className="donut-unit">Watts</span>
      </div>

      {/* Legend */}
      <div className="donut-legend">
        {chartData.segments.map((segment, index) => (
          <div key={index} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: segment.color }} />
            <span className="legend-label">{segment.label}</span>
            <span className="legend-value">{segment.value.toFixed(1)}W</span>
          </div>
        ))}
      </div>
    </div>
  );
}
