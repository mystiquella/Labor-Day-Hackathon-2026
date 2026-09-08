import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Gauge, Mountain, Radar, ShieldAlert, ChevronRight } from "lucide-react";
import { GLACIERS, LAST_OBSERVATION_DATE } from "@/data/glaciers";
import { computeRisk, topContributingFactors, buildAnalysisText, WARNING_TEXT, RISK_COLORS, riskLevel } from "@/lib/riskModel";
import GlacierMap3D from "@/components/GlacierMap3D";
import RiskBadge from "@/components/RiskBadge";

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent || "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(
    GLACIERS.reduce((max, g) => (g.risk_score > max.risk_score ? g : max), GLACIERS[0]).glacier_id
  );

  const selected = GLACIERS.find((g) => g.glacier_id === selectedId);
  const risk = computeRisk(selected);
  const topFactors = topContributingFactors(selected, 3);

  const overall = useMemo(() => {
    const avg = Math.round(GLACIERS.reduce((s, g) => s + g.risk_score, 0) / GLACIERS.length);
    return { score: avg, level: riskLevel(avg) };
  }, []);
  const extremeCount = GLACIERS.filter((g) => g.risk_level === "EXTREME").length;
  const highCount = GLACIERS.filter((g) => g.risk_level === "HIGH").length;

  return (
    <div>
      {/* Header */}
      <div className="border-b border-white/5 px-5 py-7 sm:px-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">
          <Radar className="h-3.5 w-3.5" /> Live Monitoring Console
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Himalayan GlacierWatch</h1>
        <p className="mt-1 text-sm text-slate-400">AI-Powered Glacier Instability &amp; Flash-Flood Risk Assessment</p>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Gauge} label="Overall Risk" value={overall.level} sub={`Mean score ${overall.score}/100`} accent="text-cyan-300" />
          <StatCard icon={Activity} label="Mean Risk Score" value={`${overall.score}`} sub="across 52 monitored sites" />
          <StatCard icon={AlertTriangle} label="High + Extreme" value={highCount + extremeCount} sub={`${extremeCount} extreme · ${highCount} high`} accent="text-orange-300" />
          <StatCard icon={Mountain} label="Sites Monitored" value={GLACIERS.length} sub={`obs. ${LAST_OBSERVATION_DATE}`} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Map */}
          <div className="xl:col-span-2">
            <GlacierMap3D glaciers={GLACIERS} selectedId={selectedId} onSelect={setSelectedId} height={500} />
          </div>

          {/* Selected glacier panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Selected Glacier</div>
              <div className="mt-1 flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold text-white">{selected.glacier_name}</div>
                  <div className="text-xs text-slate-400">{selected.country} · {selected.region}</div>
                </div>
                <RiskBadge level={selected.risk_level} score={selected.risk_score} size="lg" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Coordinates" value={`${selected.latitude.toFixed(2)}, ${selected.longitude.toFixed(2)}`} />
                <Field label="Elevation" value={`${selected.elevation_m} m`} />
                <Field label="Velocity change" value={`${selected.velocity_change_percent > 0 ? "+" : ""}${selected.velocity_change_percent}%`} />
                <Field label="Temp anomaly" value={`+${selected.temperature_anomaly_c}°C`} />
                <Field label="Lake expansion" value={`${selected.lake_expansion_rate_percent}%`} />
                <Field label="Melt duration" value={`${selected.melt_duration_days} d`} />
              </div>
              <Link
                to={`/analysis?id=${selected.glacier_id}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/25"
              >
                Open full analysis <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Contributing factors */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Major Contributing Factors</div>
              <div className="mt-3 space-y-3">
                {topFactors.map((f) => (
                  <div key={f.key}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{f.label}</span>
                      <span className="text-slate-400">{Math.round(f.normalized)}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${f.normalized}%`, background: RISK_COLORS[riskLevel(f.normalized)] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI analysis + warning */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 backdrop-blur lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Activity className="h-4 w-4" /> Risk Analysis
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{buildAnalysisText(selected)}</p>
            <div className="mt-3 text-[11px] text-slate-500">Model-generated assessment using simulated data.</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldAlert className="h-4 w-4" style={{ color: RISK_COLORS[selected.risk_level] }} /> Recommended Warning Level
            </div>
            <div className="mt-2 text-lg font-bold" style={{ color: RISK_COLORS[selected.risk_level] }}>{selected.risk_level}</div>
            <p className="mt-1 text-sm text-slate-300">{WARNING_TEXT[selected.risk_level]}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              This prototype provides simulated risk estimates for educational and demonstration purposes. It does not provide real-time disaster warnings and should not be used for emergency decision-making.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-medium text-slate-200">{value}</div>
    </div>
  );
}