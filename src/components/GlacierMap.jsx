import React, { useMemo } from "react";
import { RISK_COLORS } from "@/lib/riskModel";

// Stylized Himalayan map. Linear projection of lat/lon onto an SVG canvas —
// no external map API required.
const MIN_LAT = 26, MAX_LAT = 37, MIN_LON = 67, MAX_LON = 96;
const W = 1000, H = 640;

function project(lat, lon) {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * W;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * H;
  return { x, y };
}

// Approximate ridge lines for a topographic feel.
const RIDGES = [
  "M 80 200 Q 200 160 320 180 T 560 150 T 760 120 T 960 100",
  "M 60 300 Q 220 250 380 270 T 640 240 T 920 210",
  "M 100 420 Q 260 380 420 400 T 680 370 T 940 350",
  "M 120 540 Q 300 500 460 520 T 720 500 T 950 490",
];

const COUNTRY_LABELS = [
  { name: "AFGHANISTAN", lat: 34.6, lon: 68.5 },
  { name: "PAKISTAN", lat: 33, lon: 74 },
  { name: "NEPAL", lat: 28.4, lon: 84 },
  { name: "INDIA", lat: 31, lon: 78 },
  { name: "BHUTAN", lat: 27.9, lon: 90.6 },
  { name: "TIBET", lat: 30.5, lon: 86 },
];

export default function GlacierMap({ glaciers, selectedId, onSelect, height = 460 }) {
  const markers = useMemo(
    () => glaciers.map((g) => ({ ...g, ...project(g.latitude, g.longitude) })),
    [glaciers]
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
      style={{ height }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#bgGlow)" />

        {/* grid */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={(i * W) / 10} y1="0" x2={(i * W) / 10} y2={H} stroke="#1e293b" strokeWidth="1" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={(i * H) / 7} x2={W} y2={(i * H) / 7} stroke="#1e293b" strokeWidth="1" />
        ))}

        {/* ridges */}
        {RIDGES.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="url(#ridgeGrad)" strokeWidth={2.5 - i * 0.4} opacity={0.7 - i * 0.1} />
        ))}

        {/* country labels */}
        {COUNTRY_LABELS.map((c) => {
          const { x, y } = project(c.lat, c.lon);
          return (
            <text key={c.name} x={x} y={y} fill="#64748b" fontSize="13" fontWeight="700" letterSpacing="2" textAnchor="middle" opacity="0.55">
              {c.name}
            </text>
          );
        })}

        {/* markers */}
        {markers.map((m) => {
          const isSel = m.glacier_id === selectedId;
          const color = RISK_COLORS[m.risk_level];
          return (
            <g key={m.glacier_id} onClick={() => onSelect(m.glacier_id)} className="cursor-pointer">
              {isSel && <circle cx={m.x} cy={m.y} r="14" fill={color} opacity="0.18" className="animate-ping" />}
              <circle
                cx={m.x}
                cy={m.y}
                r={isSel ? 7 : 4.5}
                fill={color}
                stroke="#0f172a"
                strokeWidth={isSel ? 2 : 1}
                className="transition-all"
              />
              {isSel && (
                <text x={m.x} y={m.y - 12} fill="#e2e8f0" fontSize="11" fontWeight="600" textAnchor="middle">
                  {m.glacier_name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-slate-950/70 px-3 py-2 text-[10px] backdrop-blur">
        {Object.entries(RISK_COLORS).map(([lvl, c]) => (
          <span key={lvl} className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: c }} />
            {lvl}
          </span>
        ))}
      </div>
      <div className="absolute right-3 top-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur">
        Stylized projection · simulated coordinates
      </div>
    </div>
  );
}