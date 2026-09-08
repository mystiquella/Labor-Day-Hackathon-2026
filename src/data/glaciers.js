// Simulated / demo dataset of Himalayan glaciers. All values are fabricated for
// educational purposes and do NOT represent real measurements.
import { computeRisk } from "@/lib/riskModel";

// Base records: id, name, country, region, coords, elevation, and a risk "profile"
// used to bias the generated indicators so the dashboard shows a spread of levels.
const BASE = [
  // --- Nepal ---
  ["HG-001", "Khumbu Glacier", "Nepal", "Khumbu Himal", 27.97, 86.83, 4900, "high"],
  ["HG-002", "Imja Glacier", "Nepal", "Khumbu Himal", 27.90, 86.95, 5050, "extreme"],
  ["HG-003", "Ngozumpa Glacier", "Nepal", "Khumbu Himal", 27.95, 86.70, 4700, "high"],
  ["HG-004", "Lhotse Glacier", "Nepal", "Khumbu Himal", 27.96, 86.93, 5600, "moderate"],
  ["HG-005", "Barun Glacier", "Nepal", "Makalu Himal", 27.88, 87.08, 4800, "moderate"],
  ["HG-006", "Langtang Glacier", "Nepal", "Langtang Himal", 28.23, 85.55, 4500, "high"],
  ["HG-007", "Lirung Glacier", "Nepal", "Langtang Himal", 28.22, 85.62, 4300, "moderate"],
  ["HG-008", "Yala Glacier", "Nepal", "Langtang Himal", 28.23, 85.61, 5100, "low"],
  ["HG-009", "Nuptse Glacier", "Nepal", "Khumbu Himal", 27.96, 86.80, 5700, "moderate"],
  ["HG-010", "Ama Dablam Glacier", "Nepal", "Khumbu Himal", 27.86, 86.86, 5200, "high"],
  ["HG-011", "Hongu Glacier", "Nepal", "Hongu Valley", 27.74, 86.88, 4600, "moderate"],
  ["HG-012", "Lumding Glacier", "Nepal", "Rolwaling Himal", 27.80, 86.50, 4700, "moderate"],
  ["HG-013", "Kangsar Glacier", "Nepal", "Annapurna", 28.50, 84.00, 4200, "low"],
  ["HG-014", "Gyabrag Glacier", "Nepal", "Khumbu Himal", 27.98, 86.78, 5000, "moderate"],
  // --- Bhutan ---
  ["HG-015", "Lugge Glacier", "Bhutan", "Lunana", 27.88, 90.45, 4600, "extreme"],
  ["HG-016", "Thorthormi Glacier", "Bhutan", "Lunana", 27.87, 90.43, 4500, "extreme"],
  ["HG-017", "Raphsthreng Glacier", "Bhutan", "Lunana", 27.88, 90.44, 4600, "high"],
  ["HG-018", "Bechung Glacier", "Bhutan", "Lunana", 27.86, 90.42, 4400, "moderate"],
  ["HG-019", "Tsansap Glacier", "Bhutan", "Lunana", 27.85, 90.46, 4700, "high"],
  ["HG-020", "Mochu Glacier", "Bhutan", "Northern Bhutan", 27.90, 90.30, 4800, "low"],
  // --- India ---
  ["HG-021", "South Lhonak Glacier", "India", "Sikkim", 27.70, 88.20, 5200, "extreme"],
  ["HG-022", "Zemu Glacier", "India", "Sikkim", 27.62, 88.30, 4800, "high"],
  ["HG-023", "Rathong Glacier", "India", "Sikkim", 27.62, 88.28, 5000, "moderate"],
  ["HG-024", "Gangotri Glacier", "India", "Garhwal", 30.93, 79.08, 4000, "high"],
  ["HG-025", "Dokriani Glacier", "India", "Garhwal", 30.85, 78.85, 3900, "moderate"],
  ["HG-026", "Chorabari Glacier", "India", "Garhwal", 30.73, 79.06, 3800, "high"],
  ["HG-027", "Satopanth Glacier", "India", "Garhwal", 30.75, 79.20, 4200, "moderate"],
  ["HG-028", "Pindari Glacier", "India", "Kumaon", 30.27, 79.98, 3600, "moderate"],
  ["HG-029", "Milam Glacier", "India", "Kumaon", 30.45, 80.00, 3700, "low"],
  ["HG-030", "Bara Shigri Glacier", "India", "Himachal", 31.83, 77.95, 4200, "moderate"],
  ["HG-031", "Chota Shigri Glacier", "India", "Himachal", 31.88, 77.90, 4300, "moderate"],
  ["HG-032", "Hamtah Glacier", "India", "Lahaul", 32.40, 77.70, 4400, "low"],
  ["HG-033", "Siachen Glacier", "India", "Karakoram", 35.50, 77.00, 5400, "moderate"],
  ["HG-034", "Kangchenjunga Glacier", "India", "Sikkim", 27.70, 88.15, 4900, "high"],
  // --- Pakistan (Karakoram) ---
  ["HG-035", "Baltoro Glacier", "Pakistan", "Karakoram", 35.75, 76.30, 4600, "moderate"],
  ["HG-036", "Hispar Glacier", "Pakistan", "Karakoram", 36.10, 75.40, 4700, "moderate"],
  ["HG-037", "Biafo Glacier", "Pakistan", "Karakoram", 35.80, 75.70, 4500, "low"],
  ["HG-038", "Passu Glacier", "Pakistan", "Karakoram", 36.43, 74.90, 4100, "moderate"],
  ["HG-039", "Batura Glacier", "Pakistan", "Karakoram", 36.50, 74.60, 4200, "low"],
  ["HG-040", "Godwin-Austen Glacier", "Pakistan", "Karakoram", 35.88, 76.50, 5000, "moderate"],
  ["HG-041", "Ghulkin Glacier", "Pakistan", "Karakoram", 36.40, 74.93, 4000, "moderate"],
  ["HG-042", "Panmah Glacier", "Pakistan", "Karakoram", 35.83, 76.20, 4400, "high"],
  // --- China / Tibet ---
  ["HG-043", "Rongbuk Glacier", "Tibet", "Everest region", 28.03, 86.99, 5500, "moderate"],
  ["HG-044", "East Rongbuk Glacier", "Tibet", "Everest region", 28.05, 87.00, 5600, "moderate"],
  ["HG-045", "Kyetrak Glacier", "Tibet", "Western Himalaya", 27.90, 86.10, 4800, "high"],
  ["HG-046", "Kangshung Glacier", "Tibet", "Everest region", 27.97, 87.08, 5200, "moderate"],
  ["HG-047", "Gurla Mandhata Glacier", "Tibet", "Transhimalaya", 30.40, 81.30, 5300, "low"],
  ["HG-048", "Mapam Yamcha Glacier", "Tibet", "Western Tibet", 30.40, 81.50, 5400, "low"],
  ["HG-049", "Namche Barwa Glacier", "Tibet", "Eastern Himalaya", 29.65, 95.05, 4200, "moderate"],
  ["HG-050", "Avalanche Glacier", "Tibet", "Eastern Himalaya", 29.60, 95.10, 4300, "moderate"],
  // --- Afghanistan / broader region ---
  ["HG-051", "Koh-i-Baba Glacier", "Afghanistan", "Hindu Kush", 34.65, 67.80, 4000, "low"],
  ["HG-052", "Sakhi Glacier", "Afghanistan", "Hindu Kush", 34.70, 67.90, 4100, "moderate"],
];

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

const PROFILE_RANGES = {
  extreme: { vc: [25, 45], tc: [-2.6, -1.8], ta: [2.2, 3.0], p7: [100, 140], md: [95, 115], le: [20, 28], hi: [2, 3], hg: 1 },
  high: { vc: [12, 25], tc: [-2.0, -1.2], ta: [1.8, 2.5], p7: [70, 110], md: [80, 100], le: [12, 20], hi: [1, 2], hg: 0.5 },
  moderate: { vc: [3, 12], tc: [-1.2, -0.5], ta: [1.2, 1.8], p7: [40, 80], md: [60, 85], le: [5, 12], hi: [0, 1], hg: 0.2 },
  low: { vc: [-10, 3], tc: [-0.5, 0.3], ta: [0.5, 1.2], p7: [10, 40], md: [40, 60], le: [0, 5], hi: [0, 0], hg: 0 },
  normal: { vc: [-8, 30], tc: [-2.2, 0.2], ta: [0.8, 2.6], p7: [20, 120], md: [50, 100], le: [2, 22], hi: [0, 2], hg: 0.3 },
};

const rnd = (rng, lo, hi) => lo + rng() * (hi - lo);

function buildGlacier([id, name, country, region, lat, lon, elev, profile]) {
  const rng = seeded(id);
  const r = PROFILE_RANGES[profile] || PROFILE_RANGES.normal;
  const velocity_change_percent = +rnd(rng, r.vc[0], r.vc[1]).toFixed(1);
  const surface_velocity_m_per_year = +rnd(rng, 8, 140).toFixed(1);
  const thickness_change_m_per_year = +rnd(rng, r.tc[0], r.tc[1]).toFixed(2);
  const mass_balance_mwe_per_year = +(thickness_change_m_per_year * 0.9).toFixed(2);
  const annual_temperature_change_c = +rnd(rng, 0.4, 2.2).toFixed(2);
  const temperature_anomaly_c = +rnd(rng, r.ta[0], r.ta[1]).toFixed(2);
  const precipitation_24h_mm = +rnd(rng, 0, 55).toFixed(1);
  const precipitation_7d_mm = +rnd(rng, r.p7[0], r.p7[1]).toFixed(1);
  const snow_cover_percent = Math.round(rnd(rng, 35, 95));
  const melt_duration_days = Math.round(rnd(rng, r.md[0], r.md[1]));
  const nearby_lake_area_km2 = +rnd(rng, 0.1, 8).toFixed(2);
  const lake_expansion_rate_percent = +rnd(rng, r.le[0], r.le[1]).toFixed(1);
  const distance_to_lake_km = +rnd(rng, 0.1, 5).toFixed(1);
  const historical_glof = rng() < r.hg;
  const historical_instability = Math.round(rnd(rng, r.hi[0], r.hi[1]));
  const glacier_area_km2 = +rnd(rng, 1, 50).toFixed(1);
  const glacier_thickness_m = Math.round(rnd(rng, 60, 300));
  const slope_degrees = +rnd(rng, 8, 40).toFixed(0);

  const base = {
    glacier_id: id,
    glacier_name: name,
    country,
    region,
    latitude: lat,
    longitude: lon,
    elevation_m: elev,
    glacier_area_km2,
    glacier_thickness_m,
    slope_degrees,
    surface_velocity_m_per_year,
    velocity_change_percent,
    thickness_change_m_per_year,
    mass_balance_mwe_per_year,
    annual_temperature_change_c,
    temperature_anomaly_c,
    precipitation_24h_mm,
    precipitation_7d_mm,
    snow_cover_percent,
    melt_duration_days,
    nearby_lake_area_km2,
    lake_expansion_rate_percent,
    distance_to_lake_km,
    historical_glof,
    historical_instability,
    last_observation: "2026-09-01",
  };
  const { score, level } = computeRisk(base);
  return { ...base, risk_score: score, risk_level: level };
}

export const GLACIERS = BASE.map(buildGlacier);

export const COUNTRIES = [...new Set(GLACIERS.map((g) => g.country))].sort();

export const LAST_OBSERVATION_DATE = "2026-09-01";