import type { HazardSnapshot } from '@/types/risk';

interface GeoJsonFeature {
  geometry?: {
    coordinates?: number[];
  };
  properties?: Record<string, unknown>;
}

interface GeoJsonFeatureCollection {
  features?: GeoJsonFeature[];
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const parseGdacsAlertScore = (alertLevel: unknown): number => {
  const level = String(alertLevel ?? '').toLowerCase();
  if (level === 'red') return 1;
  if (level === 'orange') return 0.7;
  if (level === 'green') return 0.3;
  return 0;
};

const fetchGdacs = async (lat: number, lon: number): Promise<{ snapshot: Partial<HazardSnapshot>; active: number; ok: boolean }> => {
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromdate=${from}&todate=${to}`;
  const response = await fetch(url);
  if (!response.ok) {
    return { snapshot: {}, active: 0, ok: false };
  }

  const data: GeoJsonFeatureCollection = await response.json();
  const features = data.features ?? [];

  let floodScore = 0;
  let cycloneScore = 0;
  let earthquakeScore = 0;
  let wildfireScore = 0;
  let active = 0;

  for (const feature of features) {
    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      continue;
    }

    const eventLon = Number(coords[0]);
    const eventLat = Number(coords[1]);
    const distanceKm = haversineKm(lat, lon, eventLat, eventLon);

    if (distanceKm > 1200) {
      continue;
    }

    const eventType = String(feature.properties?.eventtype ?? '').toUpperCase();
    const baseAlert = parseGdacsAlertScore(feature.properties?.alertlevel);
    const distanceWeight = clamp01(1 - distanceKm / 1200);
    const score = clamp01(baseAlert * distanceWeight);

    if (score <= 0) {
      continue;
    }

    active += 1;

    if (eventType === 'FL') {
      floodScore = Math.max(floodScore, score);
    }
    if (eventType === 'TC') {
      cycloneScore = Math.max(cycloneScore, score);
    }
    if (eventType === 'EQ') {
      earthquakeScore = Math.max(earthquakeScore, score);
    }
    if (eventType === 'WF') {
      wildfireScore = Math.max(wildfireScore, score);
    }
  }

  return {
    snapshot: {
      floodScore,
      cycloneScore,
      earthquakeScore,
      wildfireScore,
    },
    active,
    ok: true,
  };
};

const fetchUsgs = async (lat: number, lon: number): Promise<{ earthquakeScore: number; ok: boolean }> => {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const starttime = start.toISOString().slice(0, 10);
  const endtime = end.toISOString().slice(0, 10);

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=500&starttime=${starttime}&endtime=${endtime}&minmagnitude=4`;
  const response = await fetch(url);
  if (!response.ok) {
    return { earthquakeScore: 0, ok: false };
  }

  const data: GeoJsonFeatureCollection = await response.json();
  const features = data.features ?? [];

  let maxScore = 0;
  for (const feature of features) {
    const magnitude = Number(feature.properties?.mag ?? 0);
    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      continue;
    }

    const eventLon = Number(coords[0]);
    const eventLat = Number(coords[1]);
    const distanceKm = haversineKm(lat, lon, eventLat, eventLon);
    const magnitudeScore = clamp01((magnitude - 4) / 4);
    const distanceScore = clamp01(1 - distanceKm / 500);
    maxScore = Math.max(maxScore, clamp01(magnitudeScore * distanceScore));
  }

  return { earthquakeScore: maxScore, ok: true };
};

export const fetchHazardSnapshot = async (lat: number, lon: number): Promise<HazardSnapshot> => {
  const [gdacs, usgs] = await Promise.all([fetchGdacs(lat, lon), fetchUsgs(lat, lon)]);

  return {
    earthquakeScore: clamp01(Math.max(gdacs.snapshot.earthquakeScore ?? 0, usgs.earthquakeScore)),
    floodScore: clamp01(gdacs.snapshot.floodScore ?? 0),
    cycloneScore: clamp01(gdacs.snapshot.cycloneScore ?? 0),
    wildfireScore: clamp01(gdacs.snapshot.wildfireScore ?? 0),
    totalActiveAlerts: gdacs.active,
    sources: {
      gdacs: gdacs.ok,
      usgs: usgs.ok,
    },
  };
};
