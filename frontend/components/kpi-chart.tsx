"use client";

/**
 * A tiny dependency-free line chart for a KPI's weekly series.
 * Draws an SVG polyline with a light flat fill and dot markers,
 * scaled to the series' own min/max so any metric renders sensibly.
 */
export function KpiChart({
  series,
  color = "var(--primary)",
}: {
  series: { week: number; value: number }[];
  color?: string;
}) {
  // Guard: nothing to draw.
  if (series.length === 0) return null;

  const width = 260;
  const height = 72;
  const padX = 4;
  const padY = 8;

  const values = series.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1; // avoid divide-by-zero for flat lines

  const stepX =
    series.length > 1 ? (width - padX * 2) / (series.length - 1) : 0;

  // Map each point into SVG coordinates (y is inverted).
  const points = series.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (p.value - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePath = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  // Close the area down to the baseline for the fill.
  const areaPath =
    `${linePath} L ${points[points.length - 1].x} ${height - padY} ` +
    `L ${points[0].x} ${height - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[72px] w-full"
      preserveAspectRatio="none"
      role="img"
    >
      <path d={areaPath} fill={color} fillOpacity="0.08" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r="2.5"
          fill={color}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
