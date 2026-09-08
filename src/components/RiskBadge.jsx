import React from "react";
import { RISK_COLORS, RISK_BG } from "@/lib/riskModel";
import { cn } from "@/lib/utils";

export default function RiskBadge({ level, score, size = "md", showScore = true }) {
  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        RISK_BG[level],
        sizes[size]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_COLORS[level] }} />
      {level}
      {showScore && score != null && <span className="opacity-70">· {score}</span>}
    </span>
  );
}