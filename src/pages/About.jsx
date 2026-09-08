import React from "react";
import { Info, ShieldAlert, Database, Cpu } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const FACTORS = [
  { name: "Surface velocity change", weight: "20%", note: "Accelerating glacier flow signals internal instability." },
  { name: "Glacier thickness change", weight: "15%", note: "Thinning weakens the ice structure and storage capacity." },
  { name: "Temperature anomaly", weight: "15%", note: "Warm anomalies drive melt and weaken firn." },
  { name: "Recent precipitation", weight: "10%", note: "Heavy rainfall raises lake levels and runoff." },
  { name: "Glacier melt duration", weight: "10%", note: "Longer melt seasons increase total water input." },
  { name: "Nearby glacial lake expansion", weight: "15%", note: "Growing lakes raise GLOF potential." },
  { name: "Terrain / slope", weight: "5%", note: "Steeper terrain amplifies collapse and runout." },
  { name: "Historical instability / GLOF", weight: "10%", note: "Past events indicate predisposition." },
];

export default function About() {
  return (
    <div>
      <PageHeader title="About the Project" subtitle="The purpose, scope and limitations of Himalayan GlacierWatch." />

      <div className="space-y-6 p-5 sm:p-8">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Info className="h-4 w-4" /> Purpose
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            The purpose of Himalayan GlacierWatch is to demonstrate how environmental data and artificial intelligence
            could potentially be used to identify areas experiencing conditions associated with increased glacier
            instability and flash-flood risk. The prototype considers glacier movement, glacier thickness,
            temperature, precipitation, snow and melt conditions, glacial lakes, terrain, and historical events to
            produce an estimated risk level for selected Himalayan sites.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            The system does <span className="font-semibold text-white">not</span> claim to definitively predict a
            glacier collapse. Its result is an <span className="font-semibold text-white">estimated risk level based
            on available indicators</span>.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Cpu className="h-4 w-4" /> How the Model Works
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            A transparent, weighted risk-scoring algorithm combines eight normalized indicators. Each factor is
            scaled to a 0–100 contribution, then multiplied by its weight and summed into a final score from 0–100.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Factor</th>
                  <th className="px-4 py-2.5 font-medium text-right">Weight</th>
                  <th className="px-4 py-2.5 font-medium">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {FACTORS.map((f) => (
                  <tr key={f.name} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-slate-200">{f.name}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-cyan-300">{f.weight}</td>
                    <td className="px-4 py-2.5 text-slate-400">{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-slate-300">
            <div className="mb-2 font-medium text-slate-200">Risk levels:</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Level color="#22c55e" range="0–24" label="LOW" />
              <Level color="#eab308" range="25–49" label="MODERATE" />
              <Level color="#f97316" range="50–74" label="HIGH" />
              <Level color="#ef4444" range="75–100" label="EXTREME" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Database className="h-4 w-4" /> Data
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            All data in this prototype are <span className="font-semibold text-white">simulated</span>. The dataset
            contains 52 fabricated glacier records distributed across Nepal, Bhutan, northern India, Pakistan,
            Tibet and the broader Himalayan region, with realistic ranges based on Himalayan glacier environments.
            Values are generated deterministically so the risk score is stable for a given glacier. No external
            APIs, API keys, external databases, or live data services are used.
          </p>
        </section>

        <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <ShieldAlert className="h-4 w-4" /> Disclaimer
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            This prototype provides simulated risk estimates for educational and demonstration purposes. It does
            not provide real-time disaster warnings and should not be used for emergency decision-making. All data
            are simulated and the system is not an operational emergency-warning system.
          </p>
        </section>
      </div>
    </div>
  );
}

function Level({ color, range, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className="text-xs text-slate-500">{range}</span>
    </div>
  );
}