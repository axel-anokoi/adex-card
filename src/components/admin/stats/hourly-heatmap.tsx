"use client";

interface HourlyHeatmapProps {
  data: number[];
  title?: string;
}

export function HourlyHeatmap({
  data,
  title = "Distribution des ventes par heure",
}: HourlyHeatmapProps) {
  const maxValue = Math.max(...data, 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHeatColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return "var(--bg-card)";
    if (intensity < 0.25) return "rgba(0, 255, 224, 0.15)";
    if (intensity < 0.5) return "rgba(0, 255, 224, 0.3)";
    if (intensity < 0.75) return "rgba(0, 255, 224, 0.5)";
    return "rgba(0, 255, 224, 0.7)";
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "Minuit";
    if (hour < 12) return `${hour}h`;
    if (hour === 12) return "Midi";
    return `${hour}h`;
  };

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <h3
        className="mb-4 text-lg font-bold"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>

      <div className="grid grid-cols-12 gap-1">
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="h-8 w-full rounded-md transition-all hover:scale-110"
              style={{
                background: getHeatColor(data[hour]),
                border: "1px solid var(--border)",
              }}
              title={`${formatHour(hour)}: ${data[hour].toFixed(2)} FCFA`}
            />
            {hour % 4 === 0 && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                {formatHour(hour)}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          Moins
        </span>
        <div className="flex gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{
                background:
                  intensity === 0
                    ? "var(--bg-card)"
                    : `rgba(0, 255, 224, ${intensity * 0.7})`,
                border: "1px solid var(--border)",
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          Plus
        </span>
      </div>
    </div>
  );
}
