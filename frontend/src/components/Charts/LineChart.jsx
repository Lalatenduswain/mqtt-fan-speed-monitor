import { useMemo } from 'react';
import './Charts.css';

export default function LineChart({
  data,
  height = 200,
  color = '#4ade80',
  showArea = true,
  showDots = true,
  showGrid = true
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    // Normalize points to 0-100 range
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - ((d.value - min) / range) * 100,
      value: d.value,
      label: d.label
    }));

    // Create SVG path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Create area path (closed polygon)
    const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L 0 100 Z`;

    return { points, linePath, areaPath, max, min };
  }, [data]);

  if (!chartData) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <div className="line-chart" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
        {/* Grid lines */}
        {showGrid && (
          <g className="chart-grid">
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} />
            ))}
          </g>
        )}

        {/* Area fill */}
        {showArea && (
          <path
            d={chartData.areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
            opacity="0.3"
          />
        )}

        {/* Line */}
        <path
          d={chartData.linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Dots */}
        {showDots && chartData.points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            vectorEffect="non-scaling-stroke"
            className="chart-dot"
          >
            <title>{`${point.label}: ${point.value.toFixed(2)}`}</title>
          </circle>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* X-axis labels */}
      <div className="line-chart-labels">
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((item, i) => (
          <span key={i} className="line-chart-label">{item.label}</span>
        ))}
      </div>
    </div>
  );
}
