import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { GitCompareArrows } from "lucide-react";
import { GLACIERS } from "@/data/glaciers";
import { RISK_COLORS } from "@/lib/riskModel";
import RiskBadge from "@/components/RiskBadge";
import PageHeader from "@/components/PageHeader";

const METRICS = [
  { key: "elevation_m", label: "Elevation", unit: "m" },
  { key: "glacier_area_km2", label: "Glacier size", unit: "km²" },
  { key: "surface_velocity_m_per_year", label: "Surface velocity", unit: "m/yr" },
  { key: "velocity_change_percent", label: "Velocity change", unit: "%" },
  { key: "temperature_anomaly_c", label: "Temperature anomaly", unit: "°C" },
  { key: "precipitation_7d_mm", label: "Precipitation (7d)", unit: "mm" },
  { key: "lake_expansion_rate_percent", label: "Lake expansion", unit: "%" },
  { key: "risk_score", label: "Risk score", unit: "/100" },
];

function Selector({ value, onChange, excludeId }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
    >
      {GLACIERS.filter((g) => g.glacier_id !== excludeId).map((g) => (
        <option key={g.glacier_id} value={g.glacier_id}>{g.glacier_name} — {g.country}</option>
      ))}
    </select>
  );
}

export default function CompareGlaciers() {
  const [idA, setIdA] = useState(GLACIERS[0].glacier_id);
  const [idB, setIdB] = useState(GLACIERS[1].glacier_id);

  const a = GLACIERS.find((g) => g.glacier_id === idA);
  const b = GLACIERS.find((g) => g.glacier_id === idB);

  const chartData = useMemo(
    () => METRICS.map((m) => {
      const av = a[m.key];
      const bv = b[m.key];
      const max = Math.max(Math.abs(av), Math.abs(bv), 0.0001);
      return {
        metric: m.label,
        a: +((av / max) * 100).toFixed(1),
        b: +((bv / max) * 100).toFixed(1),
        aRaw: av,
        bRaw: bv,
        unit: m.unit,
      };
    }),
    [a, b]
  );

  return (
    <div>
      <PageHeader title="Compare Glaciers" subtitle="Side-by-side comparison of key indicators between two glacier sites." />

      <div className="space-y-6 p-5 sm:p-8">
        {/* Selectors */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Glacier A</div>
            <Selector value={idA} onChange={setIdA} excludeId={idB} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-300">{a.country} · {a.region}</span>
              <RiskBadge level={a.risk_level} score={a.risk_score} size="sm" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Glacier B</div>
            <Selector value={idB} onChange={setIdB} excludeId={idA} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-300">{b.country} · {b.region}</span>
              <RiskBadge level={b.risk_level} score={b.risk_score} size="sm" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Indicator</th>
                <th className="px-4 py-3 font-medium text-right">{a.glacier_name}</th>
                <th className="px-4 py-3 font-medium text-right">{b.glacier_name}</th>
                <th className="px-4 py-3 font-medium text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const av = a[m.key];
                const bv = b[m.key];
                const delta = +(av - bv).toFixed(2);
                return (
                  <tr key={m.key} className="border-b border-white/5">
                    <td className="px-4 py-3 text-slate-300">{m.label}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-100">{av}{m.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-100">{bv}{m.unit}</td>
                    <td className={`px-4 py-3 text-right ${delta > 0 ? "text-orange-300" : delta < 0 ? "text-emerald-300" : "text-slate-500"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <GitCompareArrows className="h-4 w-4 text-cyan-400" /> Relative comparison (each metric normalized to its max)
          </div>
          <div className="mb-4 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-cyan-400" />{a.glacier_name}</span>
            <span className="flex items-center gap-1.5 text-slate-300"><span className="h-2 w-2 rounded-full bg-violet-400" />{b.glacier_name}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 40, left: -10 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#475569" fontSize={10} angle={-25} textAnchor="end" interval={0} height={50} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "#1e293b40" }}
                  formatter={(val, name, props) => {
                    const raw = name === "a" ? props.payload.aRaw : props.payload.bRaw;
                    return [`${raw} ${props.payload.unit}`, name === "a" ? a.glacier_name : b.glacier_name];
                  }}
                />
                <Bar dataKey="a" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                <Bar dataKey="b" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}