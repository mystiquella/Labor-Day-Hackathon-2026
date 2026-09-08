import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, Play, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { GLACIERS } from "@/data/glaciers";
import { computeRisk, topContributingFactors, buildAnalysisText, simulateObservation, WARNING_TEXT, RISK_COLORS, riskLevel } from "@/lib/riskModel";
import RiskBadge from "@/components/RiskBadge";
import GlacierCharts from "@/components/GlacierCharts";
import PageHeader from "@/components/PageHeader";

export default function RiskAnalysis() {
  const [params, setParams] = useSearchParams();
  const initialId = params.get("id") || GLACIERS[0].glacier_id;
  const [selectedId, setSelectedId] = useState(initialId);
  const [override, setOverride] = useState(null); // simulated glacier state
  const [simulating, setSimulating] = useState(false);
  const [prevRisk, setPrevRisk] = useState(null);

  useEffect(() => {
    setOverride(null);
    setPrevRisk(null);
  }, [selectedId]);

  const baseGlacier = GLACIERS.find((g) => g.glacier_id === selectedId);
  const glacier = override || baseGlacier;
  const risk = computeRisk(glacier);
  const topFactors = topContributingFactors(glacier, 3);

  function onSelect(id) {
    setSelectedId(id);
    setParams({ id });
  }

  function runSimulation() {
    setSimulating(true);
    setPrevRisk({ level: glacier.risk_level, score: glacier.risk_score });
    setTimeout(() => {
      const next = simulateObservation(glacier);
      const r = computeRisk(next);
      next.risk_score = r.score;
      next.risk_level = r.level;
      setOverride(next);
      setSimulating(false);
    }, 1400);
  }

  function reset() {
    setOverride(null);
    setPrevRisk(null);
  }

  const changes = useMemo(() => {
    if (!override) return [];
    const diffs = [
      ["Temperature anomaly", `${baseGlacier.temperature_anomaly_c}°C`, `${override.temperature_anomaly_c}°C`],
      ["Precipitation (7d)", `${baseGlacier.precipitation_7d_mm} mm`, `${override.precipitation_7d_mm} mm`],
      ["Velocity change", `${baseGlacier.velocity_change_percent}%`, `${override.velocity_change_percent}%`],
      ["Melt duration", `${baseGlacier.melt_duration_days} d`, `${override.melt_duration_days} d`],
      ["Lake expansion", `${baseGlacier.lake_expansion_rate_percent}%`, `${override.lake_expansion_rate_percent}%`],
    ];
    return diffs.filter(([, a, b]) => a !== b);
  }, [override, baseGlacier]);

  return (
    <div>
      <PageHeader title="Risk Analysis" subtitle="Deep-dive into a single glacier's indicators, charts and model-generated assessment.">
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
        >
          {GLACIERS.map((g) => (
            <option key={g.glacier_id} value={g.glacier_id}>{g.glacier_name} — {g.country}</option>
          ))}
        </select>
      </PageHeader>

      <div className="space-y-6 p-5 sm:p-8">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Glacier</div>
                <h2 className="text-xl font-bold text-white">{glacier.glacier_name}</h2>
                <div className="text-sm text-slate-400">{glacier.country} · {glacier.region}</div>
                <div className="mt-1 text-xs text-slate-500">{glacier.latitude.toFixed(2)}, {glacier.longitude.toFixed(2)} · {glacier.elevation_m} m</div>
              </div>
              <div className="text-right">
                <RiskBadge level={glacier.risk_level} score={glacier.risk_score} size="lg" />
                <div className="mt-1 text-xs text-slate-500">Last obs. {glacier.last_observation}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Spec label="Glacier area" value={`${glacier.glacier_area_km2} km²`} />
              <Spec label="Thickness" value={`${glacier.glacier_thickness_m} m`} />
              <Spec label="Slope" value={`${glacier.slope_degrees}°`} />
              <Spec label="Surface velocity" value={`${glacier.surface_velocity_m_per_year} m/yr`} />
              <Spec label="Velocity change" value={`${glacier.velocity_change_percent > 0 ? "+" : ""}${glacier.velocity_change_percent}%`} />
              <Spec label="Thickness change" value={`${glacier.thickness_change_m_per_year} m/yr`} />
              <Spec label="Temp anomaly" value={`+${glacier.temperature_anomaly_c}°C`} />
              <Spec label="Precip (24h / 7d)" value={`${glacier.precipitation_24h_mm} / ${glacier.precipitation_7d_mm} mm`} />
              <Spec label="Snow cover" value={`${glacier.snow_cover_percent}%`} />
              <Spec label="Melt duration" value={`${glacier.melt_duration_days} d`} />
              <Spec label="Nearby lake" value={`${glacier.nearby_lake_area_km2} km²`} />
              <Spec label="Lake expansion" value={`${glacier.lake_expansion_rate_percent}%`} />
              <Spec label="Distance to lake" value={`${glacier.distance_to_lake_km} km`} />
              <Spec label="Hist. instability" value={`${glacier.historical_instability}/3`} />
              <Spec label="Historical GLOF" value={glacier.historical_glof ? "Yes" : "No"} />
            </div>
          </div>

          {/* Simulation */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Sparkles className="h-4 w-4" /> Simulation Mode
            </div>
            <p className="mt-2 text-xs text-slate-400">Generate a new simulated observation for this glacier and recalculate risk.</p>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-60"
            >
              {simulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {simulating ? "Analyzing environmental indicators…" : "Run Simulation"}
            </button>

            {simulating && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                Recalculating weighted risk model…
              </div>
            )}

            {override && !simulating && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Previous Risk</span>
                  <RiskBadge level={prevRisk.level} score={prevRisk.score} size="sm" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">New Risk</span>
                  <RiskBadge level={glacier.risk_level} score={glacier.risk_score} size="sm" />
                </div>
                {changes.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500">What changed:</div>
                    {changes.map(([label, a, b]) => (
                      <div key={label} className="flex justify-between text-slate-300">
                        <span className="text-slate-400">{label}</span>
                        <span>{a} → <span className="text-cyan-300">{b}</span></span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={reset} className="text-xs text-slate-500 underline hover:text-slate-300">Reset to baseline</button>
              </div>
            )}
          </div>
        </div>

        {/* AI analysis */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 backdrop-blur lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Activity className="h-4 w-4" /> Risk Analysis
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{buildAnalysisText(glacier)}</p>
            <div className="mt-4 space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">All weighted factors</div>
              {risk.factors.map((f) => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{f.label} <span className="text-slate-600">({Math.round(f.weight * 100)}%)</span></span>
                    <span className="text-slate-400">{Math.round(f.normalized)}/100</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${f.normalized}%`, background: RISK_COLORS[riskLevel(f.normalized)] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-slate-500">Model-generated assessment using simulated data.</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldAlert className="h-4 w-4" style={{ color: RISK_COLORS[glacier.risk_level] }} /> Warning Level
            </div>
            <div className="mt-2 text-lg font-bold" style={{ color: RISK_COLORS[glacier.risk_level] }}>{glacier.risk_level}</div>
            <p className="mt-1 text-sm text-slate-300">{WARNING_TEXT[glacier.risk_level]}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              This prototype provides simulated risk estimates for educational and demonstration purposes. It does not provide real-time disaster warnings and should not be used for emergency decision-making.
            </p>
          </div>
        </div>

        {/* Charts */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Historical Trends (simulated)</h3>
          <GlacierCharts glacier={glacier} />
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}