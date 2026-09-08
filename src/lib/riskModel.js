// Transparent, deterministic, client-side risk scoring for Himalayan GlacierWatch.
// No external APIs, no ML — just a weighted normalization of local indicators.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function riskLevel(score) {
  if (score <= 24) return "LOW";
  if (score <= 49) return "MODERATE";
  if (score <= 74) return "HIGH";
  return "EXTREME";
}

export const RISK_COLORS = {
  LOW: "#22c55e",
  MODERATE: "#eab308",
  HIGH: "#f97316",
  EXTREME: "#ef4444",
};

export const RISK_BG = {
  LOW: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  MODERATE: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  EXTREME: "bg-red-500/15 text-red-300 border-red-500/40",
};

export const WARNING_TEXT = {
  LOW: "Normal monitoring recommended.",
  MODERATE: "Increase monitoring frequency.",
  HIGH: "Enhanced monitoring and preparedness recommended.",
  EXTREME: "Immediate expert assessment and emergency preparedness recommended.",
};

// Each factor normalized to 0–100, then weighted.
export function computeRisk(g) {
  const velocity = clamp(((g.velocity_change_percent + 15) / 60) * 100);
  const thickness = clamp(((0.5 - g.thickness_change_m_per_year) / 3) * 100);
  const temperature = clamp((g.temperature_anomaly_c / 3) * 100);
  const precipitation = clamp((g.precipitation_7d_mm / 150) * 100);
  const melt = clamp(((g.melt_duration_days - 40) / 80) * 100);
  const lake = clamp((g.lake_expansion_rate_percent / 28) * 100);
  const slope = clamp(((g.slope_degrees - 8) / 35) * 100);
  const hist = clamp((g.historical_glof ? 50 : 0) + (g.historical_instability / 3) * 50);

  const factors = [
    { key: "velocity", label: "Surface velocity change", weight: 0.2, normalized: velocity, raw: g.velocity_change_percent, unit: "%" },
    { key: "thickness", label: "Glacier thickness change", weight: 0.15, normalized: thickness, raw: g.thickness_change_m_per_year, unit: "m/yr" },
    { key: "temperature", label: "Temperature anomaly", weight: 0.15, normalized: temperature, raw: g.temperature_anomaly_c, unit: "°C" },
    { key: "precipitation", label: "Recent precipitation", weight: 0.1, normalized: precipitation, raw: g.precipitation_7d_mm, unit: "mm/7d" },
    { key: "melt", label: "Glacier melt duration", weight: 0.1, normalized: melt, raw: g.melt_duration_days, unit: "days" },
    { key: "lake", label: "Nearby glacial lake expansion", weight: 0.15, normalized: lake, raw: g.lake_expansion_rate_percent, unit: "%" },
    { key: "slope", label: "Terrain / slope", weight: 0.05, normalized: slope, raw: g.slope_degrees, unit: "°" },
    { key: "hist", label: "Historical instability / GLOF", weight: 0.1, normalized: hist, raw: g.historical_instability, unit: "" },
  ];

  let score = 0;
  factors.forEach((f) => {
    f.weighted = f.normalized * f.weight;
    score += f.weighted;
  });
  score = Math.round(score);
  return { score, level: riskLevel(score), factors };
}

// Human-readable factor descriptions for the AI panel.
export function factorDescription(f) {
  switch (f.key) {
    case "velocity":
      return f.raw > 20 ? "High surface velocity increase" : f.raw > 5 ? "Above-average surface velocity increase" : "Stable surface velocity";
    case "thickness":
      return f.raw < -1.5 ? "Rapid glacier thinning" : f.raw < -0.5 ? "Ongoing glacier thinning" : "Relatively stable thickness";
    case "temperature":
      return f.raw > 2 ? "Strong temperature anomaly" : f.raw > 1.2 ? "Above-average temperature" : "Mild temperature anomaly";
    case "precipitation":
      return f.raw > 90 ? "Heavy recent precipitation" : f.raw > 50 ? "Elevated recent precipitation" : "Normal precipitation";
    case "melt":
      return f.raw > 90 ? "Prolonged melt duration" : f.raw > 65 ? "Extended melt season" : "Typical melt duration";
    case "lake":
      return f.raw > 15 ? "Rapid nearby lake expansion" : f.raw > 6 ? "Notable lake expansion" : "Slow lake growth";
    case "slope":
      return f.raw > 30 ? "Steep glacier terrain" : f.raw > 18 ? "Moderate slope" : "Gentle slope";
    case "hist":
      return f.raw >= 1 ? "a history of prior instability or GLOF events" : "no major historical events on record";
    default:
      return "";
  }
}

// Deterministic seeded RNG (mulberry32-style) from a string id.
function seeded(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// Generate 10 years of local demo history for a glacier (2017–2026).
export function generateHistory(g) {
  const rng = seeded(g.glacier_id);
  const years = [];
  for (let y = 2017; y <= 2026; y++) years.push(y);

  const velEnd = g.surface_velocity_m_per_year;
  const velStart = velEnd / (1 + g.velocity_change_percent / 100);
  const tempEnd = g.temperature_anomaly_c;
  const lakeEnd = g.nearby_lake_area_km2;
  const lakeStart = lakeEnd / (1 + g.lake_expansion_rate_percent / 100);
  const thickEnd = g.thickness_change_m_per_year;

  const velocity = years.map((y, i) => {
    const t = i / (years.length - 1);
    const noise = (rng() - 0.5) * velEnd * 0.08;
    return { year: y, value: +(velStart + (velEnd - velStart) * t + noise).toFixed(1) };
  });
  const temperature = years.map((y, i) => {
    const t = i / (years.length - 1);
    const noise = (rng() - 0.5) * 0.25;
    return { year: y, value: +(tempEnd * (0.55 + 0.45 * t) + noise).toFixed(2) };
  });
  const thickness = years.map((y, i) => {
    const t = i / (years.length - 1);
    const noise = (rng() - 0.5) * 0.08;
    return { year: y, value: +(thickEnd * (0.4 + 0.6 * t) + noise).toFixed(2) };
  });
  const lake = years.map((y, i) => {
    const t = i / (years.length - 1);
    const noise = (rng() - 0.5) * 0.12;
    return { year: y, value: +Math.max(0, lakeStart + (lakeEnd - lakeStart) * t + noise).toFixed(2) };
  });
  // Risk score trending toward current score
  const curScore = computeRisk(g).score;
  const risk = years.map((y, i) => {
    const t = i / (years.length - 1);
    const noise = (rng() - 0.5) * 4;
    return { year: y, value: Math.round(Math.max(0, Math.min(100, curScore * (0.6 + 0.4 * t) + noise))) };
  });
  return { years, velocity, temperature, thickness, lake, risk };
}

// Simulate a new observation by slightly perturbing key indicators.
export function simulateObservation(g) {
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  const updated = {
    ...g,
    temperature_anomaly_c: +(g.temperature_anomaly_c + rnd(-0.2, 0.6)).toFixed(2),
    precipitation_24h_mm: +Math.max(0, g.precipitation_24h_mm + rnd(-8, 18)).toFixed(1),
    precipitation_7d_mm: +Math.max(0, g.precipitation_7d_mm + rnd(-10, 35)).toFixed(1),
    surface_velocity_m_per_year: +Math.max(1, g.surface_velocity_m_per_year * (1 + rnd(-0.03, 0.08))).toFixed(1),
    velocity_change_percent: +(g.velocity_change_percent + rnd(-1, 5)).toFixed(1),
    melt_duration_days: Math.round(Math.max(30, Math.min(120, g.melt_duration_days + rnd(-3, 8)))),
    lake_expansion_rate_percent: +Math.max(0, g.lake_expansion_rate_percent + rnd(-1, 5)).toFixed(1),
    nearby_lake_area_km2: +Math.max(0, g.nearby_lake_area_km2 * (1 + rnd(0, 0.04))).toFixed(2),
    last_observation: new Date().toISOString().slice(0, 10),
  };
  return updated;
}

export function topContributingFactors(g, n = 3) {
  const { factors } = computeRisk(g);
  return [...factors].sort((a, b) => b.weighted - a.weighted).slice(0, n);
}

export function buildAnalysisText(g) {
  const { level } = computeRisk(g);
  const top = topContributingFactors(g, 3);
  const parts = top.map((f) => {
    if (f.key === "hist") return f.raw >= 1 ? "a history of prior instability or GLOF events" : "";
    return factorDescription(f).toLowerCase();
  }).filter(Boolean);
  const drivers = parts.filter(p => !p.startsWith("stable") && !p.startsWith("normal") && !p.startsWith("typical") && !p.startsWith("gentle") && !p.startsWith("mild") && !p.startsWith("relatively"));
  const tail = drivers.length
    ? ` The largest contributing factors are ${drivers.join(", ")}.`
    : " No single indicator is currently dominant; conditions remain comparatively stable.";
  return `Risk is currently ${level}.${tail} These conditions may indicate increased instability and elevated downstream flash-flood risk.`;
}