import React from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { generateHistory, RISK_COLORS } from "@/lib/riskModel";

const tooltipStyle = {
  contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#e2e8f0" },
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="mb-1 text-sm font-semibold text-slate-100">{title}</div>
      {subtitle && <div className="mb-3 text-xs text-slate-500">{subtitle}</div>}
      <div className="h-44">{children}</div>
    </div>
  );
}

export default function GlacierCharts({ glacier }) {
  const hist = generateHistory(glacier);
  const riskColor = RISK_COLORS[glacier.risk_level];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ChartCard title="Glacier surface velocity" subtitle="m / year (simulated)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hist.velocity} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#475569" fontSize={11} />
            <YAxis stroke="#475569" fontSize={11} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Temperature anomaly" subtitle="°C above baseline (simulated)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hist.temperature} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#475569" fontSize={11} />
            <YAxis stroke="#475569" fontSize={11} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Glacier thickness change" subtitle="m / year (negative = thinning)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hist.thickness} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#475569" fontSize={11} />
            <YAxis stroke="#475569" fontSize={11} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={0} stroke="#475569" />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {hist.thickness.map((d, i) => (
                <Cell key={i} fill={d.value < 0 ? "#ef4444" : "#22c55e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Glacial lake expansion" subtitle="nearby lake area km² (simulated)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChartLite data={hist.lake} color="#a78bfa" />
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Overall risk score trend" subtitle="0–100 (weighted model)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hist.risk} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#475569" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={riskColor} strokeWidth={2.5} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function AreaChartLite({ data, color }) {
  // small inline area-style line chart using LineChart + gradient fill
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="lakeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis dataKey="year" stroke="#475569" fontSize={11} />
        <YAxis stroke="#475569" fontSize={11} />
        <Tooltip {...tooltipStyle} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} fill="url(#lakeFill)" />
      </LineChart>
    </ResponsiveContainer>
  );
}