import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Mountain, LayoutDashboard, Map, Activity, GitCompareArrows, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/explorer", label: "Glacier Explorer", icon: Map },
  { to: "/analysis", label: "Risk Analysis", icon: Activity },
  { to: "/compare", label: "Compare Glaciers", icon: GitCompareArrows },
  { to: "/about", label: "About the Project", icon: Info },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-64 lg:min-h-screen lg:border-r border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Mountain className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">GlacierWatch</div>
              <div className="text-[10px] uppercase tracking-widest text-cyan-400/70">Himalayan System</div>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1 px-3 py-3 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 shadow-inner"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:block px-5 py-4 mt-auto text-[10px] leading-relaxed text-slate-500">
            Simulated educational prototype. No live data.
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}