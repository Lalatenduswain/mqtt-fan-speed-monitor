/**
 * Returns a color from green (speed 1) to red (speed 5)
 * Uses HSL color space for smooth gradient
 */
export function getSpeedColor(speed) {
  const clampedSpeed = Math.max(1, Math.min(5, speed));
  // Map speed 1-5 to hue 120-0 (green to red)
  const hue = 120 - ((clampedSpeed - 1) / 4) * 120;
  return `hsl(${hue}, 80%, 45%)`;
}

/**
 * Get speed level description
 */
export function getSpeedLabel(speed) {
  const labels = {
    1: 'Very Slow',
    2: 'Slow',
    3: 'Medium',
    4: 'Fast',
    5: 'Very Fast',
  };
  return labels[speed] || 'Unknown';
}
