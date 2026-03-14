import type {
  Alert,
  DisasterRisk,
  HazardSnapshot,
  LiveConditions,
  Location,
  RiskFactor,
  RiskScores,
  SafePlace,
} from '@/types/risk';
import { INDIAN_CITIES } from '@/data/mockData';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const toScore = (value: number, min: number, max: number): number => {
  if (max <= min) {
    return 0;
  }
  return clamp01((value - min) / (max - min));
};

export const computeDisasterRisk = (
  location: Location,
  conditions: LiveConditions,
  hazards: HazardSnapshot,
): DisasterRisk => {
  const heatwave = clamp01(toScore(conditions.temperature, 32, 46) * 0.8 + toScore(35 - conditions.humidity, 0, 25) * 0.2);
  const floodFromWeather = clamp01(toScore(conditions.rainfall, 0, 50) * 0.6 + toScore(conditions.rainProbability, 20, 100) * 0.4);
  const flood = clamp01(Math.max(floodFromWeather, hazards.floodScore));

  const wildfireFromWeather = clamp01(
    toScore(conditions.temperature, 30, 45) * 0.4 +
      toScore(45 - conditions.humidity, 0, 30) * 0.35 +
      toScore(conditions.windSpeed, 10, 45) * 0.25,
  );
  const wildfire = clamp01(Math.max(wildfireFromWeather, hazards.wildfireScore));

  const coastalStates = new Set([
    'Gujarat',
    'Maharashtra',
    'Goa',
    'Karnataka',
    'Kerala',
    'Tamil Nadu',
    'Andhra Pradesh',
    'Odisha',
    'West Bengal',
    'Puducherry',
  ]);
  const coastalBoost = coastalStates.has(location.state) ? 0.2 : 0;
  const cycloneFromWeather = clamp01(toScore(conditions.windSpeed, 30, 80) * 0.6 + toScore(conditions.rainProbability, 50, 100) * 0.4 + coastalBoost);
  const cyclone = clamp01(Math.max(cycloneFromWeather, hazards.cycloneScore));

  const earthquake = clamp01(hazards.earthquakeScore);

  const overall = clamp01(heatwave * 0.24 + flood * 0.26 + wildfire * 0.2 + cyclone * 0.2 + earthquake * 0.1);

  return {
    heatwave: Number(heatwave.toFixed(2)),
    flood: Number(flood.toFixed(2)),
    wildfire: Number(wildfire.toFixed(2)),
    cyclone: Number(cyclone.toFixed(2)),
    earthquake: Number(earthquake.toFixed(2)),
    overall: Number(overall.toFixed(2)),
  };
};

const weightedAverage = (entries: Array<{ value: number | null; weight: number }>) => {
  const usable = entries.filter((entry): entry is { value: number; weight: number } => entry.value !== null);
  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) {
    return 0;
  }
  const weighted = usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0);
  return weighted / totalWeight;
};

export const computeRiskScores = (
  conditions: LiveConditions,
  disasterRisk: DisasterRisk,
  crimeRisk: number | null,
): RiskScores => {
  const aqiRisk = clamp01(toScore(conditions.aqi, 40, 300));

  const climateRisk = clamp01(
    toScore(Math.abs(conditions.temperature - 28), 0, 14) * 0.45 +
      toScore(Math.abs(conditions.humidity - 55), 0, 45) * 0.35 +
      toScore(conditions.windSpeed, 10, 55) * 0.2,
  );

  const crime = crimeRisk;

  const overall = weightedAverage([
    { value: disasterRisk.overall, weight: 0.45 },
    { value: aqiRisk, weight: 0.35 },
    { value: climateRisk, weight: 0.2 },
    { value: crime, weight: 0.15 },
  ]);

  return {
    climate: Number(climateRisk.toFixed(2)),
    aqi: Number(aqiRisk.toFixed(2)),
    crime,
    disaster: disasterRisk.overall,
    overall: Number(overall.toFixed(2)),
  };
};

export const computeRiskFactors = (
  conditions: LiveConditions,
  disasterRisk: DisasterRisk,
  riskScores: RiskScores,
  hazards: HazardSnapshot,
): RiskFactor[] => {
  const factors: RiskFactor[] = [];

  if (conditions.aqi > 150) {
    factors.push({
      factor: 'High Air Pollution',
      impact: conditions.aqi > 220 ? 'high' : 'medium',
      description: 'US AQI is elevated and can impact respiratory health.',
      value: conditions.aqi,
    });
  }

  if (conditions.temperature >= 38) {
    factors.push({
      factor: 'Heat Stress Conditions',
      impact: conditions.temperature >= 42 ? 'high' : 'medium',
      description: 'Current temperature indicates heat stress risk.',
      value: `${conditions.temperature} C`,
    });
  }

  if (disasterRisk.flood >= 0.55) {
    factors.push({
      factor: 'Flood Susceptibility',
      impact: disasterRisk.flood >= 0.7 ? 'high' : 'medium',
      description: 'Rainfall signal and active hazard feeds indicate flood exposure.',
      value: `${Math.round(disasterRisk.flood * 100)}%`,
    });
  }

  if (disasterRisk.cyclone >= 0.55) {
    factors.push({
      factor: 'Cyclone/Tropical Storm Exposure',
      impact: disasterRisk.cyclone >= 0.75 ? 'high' : 'medium',
      description: 'Wind/rain profile and hazard alerts show elevated cyclone-like risk.',
      value: `${Math.round(disasterRisk.cyclone * 100)}%`,
    });
  }

  if (hazards.totalActiveAlerts > 0) {
    factors.push({
      factor: 'Active Regional Hazard Alerts',
      impact: hazards.totalActiveAlerts >= 3 ? 'high' : 'medium',
      description: 'Recent GDACS/USGS events detected within the regional radius.',
      value: hazards.totalActiveAlerts,
    });
  }

  if (riskScores.crime === null) {
    factors.push({
      factor: 'Crime Dataset Pending Integration',
      impact: 'low',
      description: 'Crime score omitted until NCRB/district dataset is mapped and loaded.',
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return factors.sort((a, b) => order[a.impact] - order[b.impact]).slice(0, 6);
};

export const computeAlerts = (
  conditions: LiveConditions,
  riskScores: RiskScores,
  disasterRisk: DisasterRisk,
  hazards: HazardSnapshot,
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();

  if (riskScores.overall >= 0.7) {
    alerts.push({
      id: 'overall-high',
      type: 'danger',
      title: 'High Multi-Risk Alert',
      message: 'Combined risk is high. Monitor official advisories and avoid unnecessary travel.',
      timestamp: now,
    });
  }

  if (conditions.aqi >= 200) {
    alerts.push({
      id: 'aqi-unhealthy',
      type: conditions.aqi >= 300 ? 'severe' : 'warning',
      title: 'Air Quality Health Advisory',
      message: 'Air quality is unhealthy. Limit outdoor activity and use protection where possible.',
      timestamp: now,
    });
  }

  if (disasterRisk.flood >= 0.65 || disasterRisk.cyclone >= 0.65) {
    alerts.push({
      id: 'hydromet-alert',
      type: 'danger',
      title: 'Flood/Cyclone Risk Alert',
      message: 'Hydrometeorological risk is elevated. Prepare emergency contacts and essentials.',
      timestamp: now,
    });
  }

  if (hazards.earthquakeScore >= 0.6) {
    alerts.push({
      id: 'seismic-watch',
      type: 'warning',
      title: 'Regional Seismic Activity',
      message: 'Recent nearby earthquake activity detected in USGS feeds.',
      timestamp: now,
    });
  }

  if (!hazards.sources.gdacs || !hazards.sources.usgs) {
    alerts.push({
      id: 'partial-hazard-feed',
      type: 'info',
      title: 'Partial Hazard Feed Availability',
      message: 'One or more hazard sources are temporarily unavailable. Scores use currently reachable feeds only.',
      timestamp: now,
    });
  }

  return alerts;
};

export const computeSafePlaces = (): SafePlace[] => {
  return [];
};

const distanceKm = (aLat: number, aLon: number, bLat: number, bLon: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return earthRadiusKm * c;
};

export const computeSafePlacesFromNearest = (
  currentLocation: Location,
  currentOverallRisk: number,
  limit = 5,
): SafePlace[] => {
  return INDIAN_CITIES
    .filter((city) => city.city !== currentLocation.city)
    .map((city) => {
      const distance = Math.round(distanceKm(currentLocation.lat, currentLocation.lon, city.lat, city.lon));
      const safeScore = clamp01(1 - currentOverallRisk * 0.7 - Math.min(distance, 1200) / 8000);

      return {
        city: city.city,
        state: city.state,
        distance,
        safeScore: Number(safeScore.toFixed(2)),
        riskReduction: Math.max(0, Math.round((safeScore - (1 - currentOverallRisk)) * 100)),
        reasons: [
          'Nearest supported assessment area',
          'Live weather and hazard feeds available',
        ],
        lat: city.lat,
        lon: city.lon,
      };
    })
    .filter((place) => place.distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};
