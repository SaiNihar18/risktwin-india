import { describe, it, expect } from 'vitest';
import { calculateIndianAQI, fetchWeatherData, fetchAirPollution, fetchForecastData } from '@/services/weatherApi';
import { getActiveFiresForLocation, fetchAllIndiaActiveFires, calculateDistanceKm } from '@/services/firmsApi';
import { generateDisasterRisk, generateRiskScores, getSeismicRisk, getCrimeRisk } from '@/services/riskAnalysis';
import { INDIAN_CITIES } from '@/data/locations';

describe('RiskTwin API and Telemetry Integration', () => {
  it('calculates accurate Indian NAQI from particulate matter PM2.5 and PM10', () => {
    // Standard CPCB breakpoints
    expect(calculateIndianAQI(15, 25)).toBeGreaterThanOrEqual(15);
    expect(calculateIndianAQI(75, 120)).toBeGreaterThan(100);
    expect(calculateIndianAQI(180, 260)).toBeGreaterThan(300);
  });

  it('calculates Haversine geographic distance accurately in km', () => {
    // Delhi to Mumbai (~1150-1200 km)
    const dist = calculateDistanceKm(28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1300);
  });

  it('determines BIS Indian seismic zone risk deterministically', () => {
    expect(getSeismicRisk('Assam', 'Guwahati')).toBe(0.9); // Zone V
    expect(getSeismicRisk('Delhi', 'New Delhi')).toBe(0.65); // Zone IV
    expect(getSeismicRisk('Karnataka', 'Bangalore')).toBe(0.35); // Zone III
  });

  it('determines metropolitan crime risk factors', () => {
    expect(getCrimeRisk('New Delhi')).toBe(0.78);
    expect(getCrimeRisk('Panaji')).toBe(0.18);
  });

  it('evaluates multi-hazard disaster risk composite with NASA FIRMS fire telemetry', () => {
    const delhi = INDIAN_CITIES[0];
    const liveConditions = {
      temperature: 36,
      humidity: 40,
      windSpeed: 18,
      windDirection: 270,
      windCompass: 'W',
      rainfall: 0,
      rainProbability: 10,
      aqi: 165,
      pm25: 78,
      lastUpdated: new Date(),
      activeFiresNearby: 2,
      closestFireDistance: 45,
    };

    const disasterRisk = generateDisasterRisk(delhi, liveConditions);
    expect(disasterRisk.heatwave).toBeGreaterThan(0.2);
    expect(disasterRisk.wildfire).toBeGreaterThan(0.3); // boosted by active satellite hotspots
    expect(disasterRisk.earthquake).toBe(0.65);
    expect(disasterRisk.overall).toBeGreaterThanOrEqual(0.65);

    const riskScores = generateRiskScores(liveConditions, disasterRisk, delhi);
    expect(riskScores.overall).toBeGreaterThan(0.4);
  });

  it('fetches real live NASA FIRMS active fire hotspots for India', async () => {
    const fires = await fetchAllIndiaActiveFires();
    expect(Array.isArray(fires)).toBe(true);
  }, 15000);
});
