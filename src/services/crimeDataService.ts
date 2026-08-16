import type { Location } from '@/types/risk';

interface CrimeCsvRow {
  state: string;
  district?: string;
  year?: number;
  crime_rate_per_100k: number;
}

let stateCrimeRiskCache: Map<string, number> | null = null;
let loadPromise: Promise<Map<string, number>> | null = null;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
};

const normalizeStateKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

const loadCrimeStateRiskMap = async (): Promise<Map<string, number>> => {
  const response = await fetch('/data/ncrb_state_crime_rates.csv');
  if (!response.ok) {
    return new Map();
  }

  const raw = await response.text();
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return new Map();
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const stateIdx = header.indexOf('state');
  const districtIdx = header.indexOf('district');
  const yearIdx = header.indexOf('year');
  const rateIdx = header.indexOf('crime_rate_per_100k');

  if (stateIdx < 0 || rateIdx < 0) {
    return new Map();
  }

  const rows: CrimeCsvRow[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const state = cols[stateIdx] ?? '';
    const rate = Number(cols[rateIdx]);
    if (!state || Number.isNaN(rate)) {
      continue;
    }

    const district = districtIdx >= 0 ? cols[districtIdx] : undefined;
    const year = yearIdx >= 0 ? Number(cols[yearIdx]) : undefined;

    rows.push({
      state,
      district,
      year: Number.isNaN(year) ? undefined : year,
      crime_rate_per_100k: rate,
    });
  }

  if (rows.length === 0) {
    return new Map();
  }

  const byState = new Map<string, number[]>();
  rows.forEach((row) => {
    const key = normalizeStateKey(row.state);
    if (!byState.has(key)) {
      byState.set(key, []);
    }
    byState.get(key)?.push(row.crime_rate_per_100k);
  });

  const stateRate = new Map<string, number>();
  byState.forEach((rates, key) => {
    const mean = rates.reduce((sum, v) => sum + v, 0) / rates.length;
    stateRate.set(key, mean);
  });

  const values = Array.from(stateRate.values());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const normalized = new Map<string, number>();

  stateRate.forEach((rate, key) => {
    const score = max > min ? (rate - min) / (max - min) : 0.5;
    normalized.set(key, Number(clamp01(score).toFixed(2)));
  });

  return normalized;
};

export const getCrimeRiskForLocation = async (location: Location): Promise<number | null> => {
  if (!stateCrimeRiskCache) {
    if (!loadPromise) {
      loadPromise = loadCrimeStateRiskMap();
    }
    stateCrimeRiskCache = await loadPromise;
  }

  const key = normalizeStateKey(location.state);
  if (!stateCrimeRiskCache.has(key)) {
    return null;
  }

  return stateCrimeRiskCache.get(key) ?? null;
};
