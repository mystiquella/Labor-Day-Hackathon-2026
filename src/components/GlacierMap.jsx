import React, { useMemo } from "react";
import { RISK_COLORS } from "@/lib/riskModel";

// Map-like Himalayan visualization. Linear projection of lat/lon onto an SVG
// canvas with topographic relief, graticule, country borders, rivers, compass
// and scale bar — no external map API required.
const MIN_LAT = 26, MAX_LAT = 37, MIN_LON = 67, MAX_LON = 96;
const W = 1000, H = 640;

function project(lat, lon) {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * W;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * H;
  return { x, y };
}

const toPath = (pts) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${project(p[0], p[1]).x.toFixed(1)} ${project(p[0], p[1]).y.toFixed(1)}`).join(" ");

// Spine of the Himalaya–Karakoram–Hindu Kush orographic belt (lat, lon).
const SPINE = [
  [34.5, 70.5], [35.5, 74.5], [36.0, 76.0], [35.5, 76.5], [34.5, 77.0],
  [33.0, 77.5], [31.5, 78.5], [30.5, 79.5], [29.5, 81.0], [28.5, 83.0],
  [28.2, 85.5], [27.9, 87.5], [27.8, 89.0], [27.9, 90.5], [28.2, 91.5],
  [28.5, 92.5], [29.0, 94.0], [29.5, 95.0],
];

// Additional ridge spurs (Karakoram north, Ladakh, south spurs).
const SPURS = [
  [[35.5, 76.0], [36.2, 75.5], [36.5, 74.8]],
  [[33.0, 77.5], [33.8, 77.0], [34.2, 76.2]],
  [[28.5, 83.0], [28.7, 84.5], [28.6, 86.2]],
];

// Major rivers (approximate, lat/lon).
const RIVERS = {
  Indus: [[31.5, 81.5], [32.5, 78.5], [34.0, 76.0], [35.0, 74.5], [36.0, 72.5]],
  Ganges: [[30.5, 79.0], [29.5, 78.5], [28.5, 78.0], [27.5, 79.5], [26.8, 82.0]],
  Brahmaputra: [[29.5, 94.0], [28.5, 92.5], [27.8, 91.0], [27.0, 89.5], [26.6, 88.5]],
};

// Approximate international borders (lat, lon).
const BORDERS = {
  "pak-ind": [[35.0, 74.0], [34.5, 75.0], [34.0, 76.0], [33.0, 77.0], [32.5, 78.0]],
  "ind-nep": [[30.3, 79.0], [29.5, 80.5], [28.5, 82.0], [28.2, 84.0], [27.9, 86.0], [26.8, 88.0]],
  "nep-tib": [[30.5, 81.0], [30.2, 83.0], [29.5, 85.0], [28.7, 87.0], [27.9, 88.0]],
  "ind-tib": [[31.0, 78.5], [30.5, 80.0], [30.2, 82.0], [30.0, 88.5], [29.0, 90.0], [28.3, 91.5], [28.0, 92.0]],
  "bhu-tib": [[28.2, 89.0], [28.0, 90.5], [28.3, 92.0]],
};

const COUNTRY_LABELS = [
  { name: "AFGHANISTAN", lat: 34.6, lon: 68.5 },
  { name: "PAKISTAN", lat: 33.2, lon: 72.5 },
  { name: "NEPAL", lat: 28.0, lon: 84.2 },
  { name: "INDIA", lat: 29.5, lon: 78.5 },
  { name: "BHUTAN", lat: 27.4, lon: 90.6 },
  { name: "TIBET", lat: 32.5, lon: 86.0 },
];

const RANGE_LABELS = [
  { name: "Hindu Kush", lat: 35.4, lon: 71.5, rot: -28 },
  { name: "Karakoram", lat: 35.8, lon: 75.8, rot: -24 },
  { name: "Himalaya", lat: 28.6, lon: 85.5, rot: -14 },
  { name: "Eastern Himalaya", lat: 28.4, lon: 92.2, rot: -20 },
];

export default function GlacierMap({ glaciers, selectedId, onSelect, height = 460 }) {
  const markers = useMemo(
    () => glaciers.map((g) => ({ ...g, ...project(g.latitude, g.longitude) })),
    [glaciers]
  );

  // Build the relief band as a closed path between two offset edges.
  const northEdge = SPINE.map(([la, lo]) => [la + 1.4, lo]);
  const southEdge = SPINE.slice().reverse().map(([la, lo]) => [la - 1.0, lo]);
  const bandPath = `${toPath(northEdge)} ${toPath(southEdge).replace(/^M/, "L")} Z`;

  // Graticule ticks.
  const lonTicks = [70, 75, 80, 85, 90, 95];
  const latTicks = [26, 28, 30, 32, 34, 36];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
      style={{ height }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="relief" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#64748b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#bgGlow)" />

        {/* Graticule */}
        {lonTicks.map((lo) => {
          const { x } = project(0, lo);
          return (
            <g key={`glon${lo}`}>
              <line x1={x} y1="0" x2={x} y2={H} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
              <text x={x} y={H - 6} fill="#475569" fontSize="9" textAnchor="middle">{lo}°E</text>
            </g>
          );
        })}
        {latTicks.map((la) => {
          const { y } = project(la, 0);
          return (
            <g key={`glat${la}`}>
              <line x1="0" y1={y} x2={W} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
              <text x="5" y={y - 3} fill="#475569" fontSize="9">{la}°N</text>
            </g>
          );
        })}

        {/* Country borders (dashed) */}
        {Object.entries(BORDERS).map(([key, pts]) => (
          <path key={key} d={toPath(pts)} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="5 4" opacity="0.45" />
        ))}

        {/* Himalayan relief band (soft shadow + filled) */}
        <path d={bandPath} fill="url(#relief)" filter="url(#soft)" opacity="0.9" />
        <path d={bandPath} fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.25" />

        {/* Contour ridge lines along the spine */}
        {[0, -0.5, 0.5, -1.0, 1.0].map((off, i) => {
          const pts = SPINE.map(([la, lo]) => [la + off, lo]);
          return (
            <path
              key={`ridge${i}`}
              d={toPath(pts)}
              fill="none"
              stroke="url(#ridgeGrad)"
              strokeWidth={2.2 - i * 0.35}
              opacity={0.65 - i * 0.1}
            />
          );
        })}
        {/* Spur ridges */}
        {SPURS.map((pts, i) => (
          <path key={`spur${i}`} d={toPath(pts)} fill="none" stroke="#94a3b8" strokeWidth="1.2" opacity="0.4" />
        ))}

        {/* Rivers */}
        {Object.entries(RIVERS).map(([name, pts]) => (
          <path key={name} d={toPath(pts)} fill="none" stroke="#38bdf8" strokeWidth="1.3" opacity="0.55" strokeLinecap="round" />
        ))}

        {/* Country labels */}
        {COUNTRY_LABELS.map((c) => {
          const { x, y } = project(c.lat, c.lon);
          return (
            <text key={c.name} x={x} y={y} fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="2" textAnchor="middle" opacity="0.5">
              {c.name}
            </text>
          );
        })}

        {/* Range labels */}
        {RANGE_LABELS.map((r) => {
          const { x, y } = project(r.lat, r.lon);
          return (
            <text
              key={r.name}
              x={x}
              y={y}
              fill="#cbd5e1"
              fontSize="11"
              fontStyle="italic"
              fontWeight="600"
              letterSpacing="1"
              textAnchor="middle"
              opacity="0.6"
              transform={`rotate(${r.rot} ${x} ${y})`}
            >
              {r.name}
            </text>
          );
        })}

        {/* Markers */}
        {markers.map((m) => {
          const isSel = m.glacier_id === selectedId;
          const color = RISK_COLORS[m.risk_level];
          return (
            <g key={m.glacier_id} onClick={() => onSelect(m.glacier_id)} className="cursor-pointer">
              <title>{`${m.glacier_name} (${m.country}) — ${m.risk_level} · ${m.risk_score}`}</title>
              {isSel && <circle cx={m.x} cy={m.y} r="16" fill={color} opacity="0.18" className="animate-ping" />}
              <circle cx={m.x} cy={m.y} r={isSel ? 6.5 : 4} fill={color} stroke="#0f172a" strokeWidth={isSel ? 2 : 1} className="transition-all" />
              {isSel && (
                <text x={m.x} y={m.y - 13} fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle" style={{ paintOrder: "stroke", stroke: "#0f172a", strokeWidth: 3 }}>
                  {m.glacier_name}
                </text>
              )}
            </g>
          );
        })}

        {/* Compass rose */}
        <g transform={`translate(${W - 58} 52)`} opacity="0.8">
          <circle r="26" fill="#0f172a" stroke="#334155" strokeWidth="1" opacity="0.6" />
          <path d="M 0 -22 L 6 4 L 0 0 L -6 4 Z" fill="#f87171" />
          <path d="M 0 22 L 6 -4 L 0 0 L -6 -4 Z" fill="#94a3b8" />
          <text x="0" y="-28" fill="#e2e8f0" fontSize="9" fontWeight="700" textAnchor="middle">N</text>
        </g>

        {/* Scale bar */}
        <g transform={`translate(${W - 150} ${H - 28})`} opacity="0.8">
          <rect x="0" y="0" width="60" height="6" fill="#e2e8f0" />
          <rect x="60" y="0" width="60" height="6" fill="#334155" />
          <rect x="0" y="0" width="120" height="6" fill="none" stroke="#94a3b8" strokeWidth="1" />
          <text x="0" y="20" fill="#94a3b8" fontSize="9">0</text>
          <text x="120" y="20" fill="#94a3b8" fontSize="9" textAnchor="end">≈ 350 km</text>
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-slate-950/70 px-3 py-2 text-[10px] backdrop-blur">
        {Object.entries(RISK_COLORS).map(([lvl, c]) => (
          <span key={lvl} className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
            {lvl}
          </span>
        ))}
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur">
        Stylized map · simulated coordinates
      </div>
    </div>
  );
}