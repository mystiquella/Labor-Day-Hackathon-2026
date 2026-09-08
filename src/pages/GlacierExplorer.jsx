import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { GLACIERS, COUNTRIES } from "@/data/glaciers";
import { RISK_COLORS } from "@/lib/riskModel";
import RiskBadge from "@/components/RiskBadge";
import PageHeader from "@/components/PageHeader";

const RISK_FILTERS = ["ALL", "EXTREME", "HIGH", "MODERATE", "LOW"];

export default function GlacierExplorer() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortDir, setSortDir] = useState("desc");

  const list = useMemo(() => {
    let rows = GLACIERS.filter((g) => {
      if (country !== "ALL" && g.country !== country) return false;
      if (riskFilter !== "ALL" && g.risk_level !== riskFilter) return false;
      if (query && !g.glacier_name.toLowerCase().includes(query.toLowerCase()) && !g.region.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    rows.sort((a, b) => (sortDir === "desc" ? b.risk_score - a.risk_score : a.risk_score - b.risk_score));
    return rows;
  }, [query, country, riskFilter, sortDir]);

  return (
    <div>
      <PageHeader title="Glacier Explorer" subtitle="Browse, search, filter and sort all monitored Himalayan glacier sites.">
        <span className="text-xs text-slate-500">{list.length} of {GLACIERS.length} sites</span>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {/* Controls */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search glacier name or region…"
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="ALL">All countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1.5">
            {RISK_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${riskFilter === r ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-900/60 text-slate-400 hover:text-slate-200"}`}
              >
                {r === "ALL" ? "All risk" : r}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:text-slate-100"
          >
            <ArrowUpDown className="h-4 w-4" /> Risk {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Glacier</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium text-right">Elevation</th>
                  <th className="px-4 py-3 font-medium text-right">Vel. Δ</th>
                  <th className="px-4 py-3 font-medium text-right">Lake Δ</th>
                  <th className="px-4 py-3 font-medium text-right">Risk</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((g) => (
                  <tr key={g.glacier_id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-slate-100">{g.glacier_name}</td>
                    <td className="px-4 py-3 text-slate-400">{g.country}</td>
                    <td className="px-4 py-3 text-slate-400">{g.region}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{g.elevation_m} m</td>
                    <td className="px-4 py-3 text-right text-slate-300">{g.velocity_change_percent > 0 ? "+" : ""}{g.velocity_change_percent}%</td>
                    <td className="px-4 py-3 text-right text-slate-300">{g.lake_expansion_rate_percent}%</td>
                    <td className="px-4 py-3 text-right"><RiskBadge level={g.risk_level} score={g.risk_score} size="sm" /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/analysis?id=${g.glacier_id}`} className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300">
                        Analyze <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No glaciers match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}