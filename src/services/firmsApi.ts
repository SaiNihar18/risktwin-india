import type { ActiveFirePoint } from '@/types/risk';

const NASA_FIRMS_MAP_KEY = 'a0c2ea91f8d5c59b5912a31b301e4951';

// Cache for India-wide active fires to prevent excessive network calls
let cachedFires: ActiveFirePoint[] = [];
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

export interface FirmsFireSummary {
  hotspotsNearby: number;
  closestDistanceKm: number | null;
  maxFrp: number;
  nearbyFires: ActiveFirePoint[];
  allIndiaFires: ActiveFirePoint[];
}

// Parse NASA FIRMS CSV response into structured ActiveFirePoint objects
const parseFirmsCsv = (csvText: string): ActiveFirePoint[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const frpIdx = headers.indexOf('frp');
  const brightIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
  const confIdx = headers.indexOf('confidence');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');

  const fires: ActiveFirePoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    const frp = parseFloat(cols[frpIdx]) || 0;
    const brightness = parseFloat(cols[brightIdx]) || 0;
    const confidence = cols[confIdx] || 'nominal';
    const acqDate = cols[dateIdx] || '';
    const acqTime = cols[timeIdx] || '';

    if (!isNaN(lat) && !isNaN(lon)) {
      fires.push({
        lat,
        lon,
        frp: Math.round(frp * 10) / 10,
        brightness: Math.round(brightness * 10) / 10,
        confidence,
        acqDate,
        acqTime,
      });
    }
  }

  return fires;
};

// Calculate Haversine distance in km between two lat/lon points
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Fetch India-wide active fire hotspots from NASA FIRMS VIIRS satellite feed
export const fetchAllIndiaActiveFires = async (): Promise<ActiveFirePoint[]> => {
  const now = Date.now();
  if (cachedFires.length > 0 && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedFires;
  }

  try {
    console.log('[NASA FIRMS] Fetching real-time satellite fire hotspots for India...');
    // Bounding box for Indian region: minLon 68, minLat 6, maxLon 97, maxLat 37
    const bbox = '68,6,97,37';
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/${bbox}/1`;

    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn('[NASA FIRMS] Request failed with status:', resp.status);
      return cachedFires;
    }

    const csvText = await resp.text();
    const parsed = parseFirmsCsv(csvText);

    cachedFires = parsed;
    lastFetchTime = now;
    console.log(`[NASA FIRMS] Successfully loaded ${parsed.length} active thermal fire hotspots.`);
    return parsed;
  } catch (error) {
    console.warn('[NASA FIRMS] Failed to fetch active fire hotspots:', error);
    return cachedFires;
  }
};

// Get active fire summary for a specific geographic coordinate within radiusKm
export const getActiveFiresForLocation = async (
  lat: number,
  lon: number,
  radiusKm = 150
): Promise<FirmsFireSummary> => {
  const allFires = await fetchAllIndiaActiveFires();

  const nearby: ActiveFirePoint[] = [];
  let closestDist: number | null = null;
  let maxFrp = 0;

  for (const fire of allFires) {
    const dist = calculateDistanceKm(lat, lon, fire.lat, fire.lon);
    if (dist <= radiusKm) {
      nearby.push(fire);
      if (closestDist === null || dist < closestDist) {
        closestDist = dist;
      }
      if (fire.frp > maxFrp) {
        maxFrp = fire.frp;
      }
    }
  }

  return {
    hotspotsNearby: nearby.length,
    closestDistanceKm: closestDist,
    maxFrp,
    nearbyFires: nearby,
    allIndiaFires: allFires,
  };
};
