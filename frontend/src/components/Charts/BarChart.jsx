import './Charts.css';

export default function BarChart({ data, maxValue, height = 200, showLabels = true, color = '#4ade80' }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-chart-bars">
        {data.map((item, index) => {
          const heightPercent = (item.value / max) * 100;
          return (
            <div key={index} className="bar-column">
              <div className="bar-value-label">
                {item.value > 0 ? item.value.toFixed(1) : ''}
              </div>
              <div
                className="bar"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: item.color || color,
                  opacity: item.value > 0 ? 1 : 0.3
                }}
                title={`${item.label}: ${item.value.toFixed(2)}`}
              />
              {showLabels && (
                <div className="bar-label">{item.label}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
