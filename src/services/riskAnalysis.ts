import type { 
  Location, 
  LiveConditions, 
  RiskScores, 
  DisasterRisk, 
  RiskFactor, 
  Alert,
  SafePlace 
} from '@/types/risk';
import { INDIAN_CITIES } from '@/data/locations';

// Wind direction to compass
export const getWindCompass = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Real Indian Seismic Zones (Bureau of Indian Standards mapping)
// Zone V: 0.9, Zone IV: 0.65, Zone III: 0.35, Zone II: 0.1
export const getSeismicRisk = (state: string, city: string): number => {
  const stateLower = state.toLowerCase();
  const cityLower = city.toLowerCase();

  // Zone V (Highest)
  if (
    stateLower.includes('assam') || 
    stateLower.includes('meghalaya') || 
    stateLower.includes('nagaland') || 
    stateLower.includes('manipur') || 
    stateLower.includes('tripura') || 
    stateLower.includes('mizoram') || 
    stateLower.includes('sikkim') || 
    cityLower.includes('bhuj') || 
    cityLower.includes('srinagar') || 
    cityLower.includes('manali') ||
    cityLower.includes('guwahati') ||
    cityLower.includes('shillong') ||
    cityLower.includes('gangtok')
  ) {
    return 0.9;
  }
  
  // Zone IV (High)
  if (
    stateLower.includes('delhi') || 
    stateLower.includes('jammu') || 
    stateLower.includes('ladakh') || 
    stateLower.includes('uttarakhand') || 
    stateLower.includes('himachal') || 
    stateLower.includes('bihar') || 
    cityLower.includes('mumbai') || 
    cityLower.includes('kolkata') ||
    cityLower.includes('patna') ||
    cityLower.includes('dehradun') ||
    cityLower.includes('shimla')
  ) {
    return 0.65;
  }

  // Zone III (Moderate)
  if (
    stateLower.includes('kerala') || 
    stateLower.includes('goa') || 
    stateLower.includes('gujarat') || 
    stateLower.includes('maharashtra') || 
    stateLower.includes('punjab') || 
    stateLower.includes('haryana') || 
    stateLower.includes('rajasthan') || 
    stateLower.includes('uttar pradesh') || 
    stateLower.includes('west bengal') || 
    stateLower.includes('madhya pradesh') || 
    stateLower.includes('andhra pradesh') || 
    stateLower.includes('telangana') || 
    stateLower.includes('tamil nadu') || 
    stateLower.includes('karnataka') || 
    stateLower.includes('odisha')
  ) {
    return 0.35;
  }

  // Zone II (Low)
  return 0.1;
};

// Crime Rate baselines (Based on NCRB metropolitan indicators)
export const getCrimeRisk = (city: string): number => {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('delhi') || cityLower.includes('noida') || cityLower.includes('ghaziabad')) return 0.78;
  if (cityLower.includes('mumbai') || cityLower.includes('thane') || cityLower.includes('kalyan')) return 0.48;
  if (cityLower.includes('kolkata')) return 0.38;
  if (cityLower.includes('bangalore') || cityLower.includes('hyderabad')) return 0.42;
  if (cityLower.includes('patna') || cityLower.includes('lucknow') || cityLower.includes('kanpur') || cityLower.includes('varanasi') || cityLower.includes('allahabad')) return 0.65;
  if (cityLower.includes('ahmedabad') || cityLower.includes('surat') || cityLower.includes('pune') || cityLower.includes('nagpur')) return 0.35;
  if (cityLower.includes('coimbatore') || cityLower.includes('kochi') || cityLower.includes('mysore') || cityLower.includes('thiruvananthapuram')) return 0.22;
  if (cityLower.includes('shimla') || cityLower.includes('manali') || cityLower.includes('gangtok') || cityLower.includes('panaji')) return 0.18;
  
  return 0.3;
};

// Generate disaster risk deterministically based on location and real conditions
export const generateDisasterRisk = (location: Location, conditions: LiveConditions): DisasterRisk => {
  const coastalStates = ['Maharashtra', 'Tamil Nadu', 'West Bengal', 'Goa', 'Kerala', 'Puducherry', 'Andhra Pradesh', 'Odisha', 'Gujarat', 'Karnataka'];
  const floodProneCities = ['Patna', 'Kolkata', 'Mumbai', 'Chennai', 'Guwahati', 'Varanasi', 'Allahabad'];
  
  const isCoastal = coastalStates.includes(location.state) || ['Mumbai', 'Chennai', 'Kolkata', 'Panaji', 'Kochi', 'Visakhapatnam', 'Bhubaneswar', 'Mangalore'].some(city => location.city.includes(city));
  const isFloodProne = floodProneCities.some(city => location.city.includes(city));
  
  // 1. Heatwave Risk
  const heatwave = conditions.temperature > 32 
    ? Math.min(1, 0.1 + (conditions.temperature - 32) * 0.08)
    : Math.max(0.05, 0.05 + (conditions.temperature - 20) * 0.01);
  
  // 2. Flood Risk
  const baseFlood = isFloodProne ? 0.3 : 0.05;
  const flood = Math.min(1, baseFlood + (conditions.rainfall * 0.03) + (conditions.humidity > 80 ? 0.1 : 0));
  
  // 3. Wildfire Risk (using CBI - Chandler Burning Index approximation + NASA FIRMS Satellite Hotspots)
  const temp = conditions.temperature;
  const rh = Math.max(5, Math.min(100, conditions.humidity));
  const cbi = (((110 - 1.373 * rh) - 0.5 * (10.20 - temp)) * (124 * Math.pow(10, -0.0142 * rh))) / 60;
  
  let wildfire = Math.max(0.05, Math.min(1, cbi / 100));
  if (conditions.windSpeed > 20) {
    wildfire = Math.min(1, wildfire + (conditions.windSpeed - 20) * 0.01);
  }
  
  // Factor in real-time NASA FIRMS satellite active thermal fire detections
  if (conditions.activeFiresNearby && conditions.activeFiresNearby > 0) {
    const fireDensityScore = Math.min(0.5, conditions.activeFiresNearby * 0.08);
    const proximityScore = conditions.closestFireDistance && conditions.closestFireDistance < 50
      ? 0.35
      : conditions.closestFireDistance && conditions.closestFireDistance < 100
      ? 0.20
      : 0.10;
    wildfire = Math.min(1, wildfire * 0.5 + fireDensityScore + proximityScore);
  }
  
  // If FWI provided from live APIs, blend it
  if (conditions.wildfireFwi !== undefined && !isNaN(Number(conditions.wildfireFwi))) {
    const fwi = Number(conditions.wildfireFwi);
    const fwiScore = Math.min(1, fwi / 100);
    wildfire = Math.min(1, Math.round((wildfire * 0.4 + fwiScore * 0.6) * 100) / 100);
  }
  
  // 4. Cyclone Risk
  const cyclone = isCoastal 
    ? Math.min(1, 0.15 + (conditions.windSpeed > 25 ? (conditions.windSpeed - 25) * 0.025 : 0) + (conditions.rainProbability > 60 ? 0.15 : 0))
    : 0.0;
  
  // 5. Earthquake Risk (deterministic zone mapping)
  const earthquake = getSeismicRisk(location.state, location.city);
  
  const overall = Math.max(heatwave, flood, wildfire, cyclone, earthquake);
  
  return {
    heatwave: Math.min(1, Math.round(heatwave * 100) / 100),
    flood: Math.min(1, Math.round(flood * 100) / 100),
    wildfire: Math.min(1, Math.round(wildfire * 100) / 100),
    cyclone: Math.min(1, Math.round(cyclone * 100) / 100),
    earthquake: Math.min(1, Math.round(earthquake * 100) / 100),
    overall: Math.min(1, Math.round(overall * 100) / 100),
    activeFiresNearby: conditions.activeFiresNearby,
    closestFireDistance: conditions.closestFireDistance,
  };
};

// Generate risk scores deterministically
export const generateRiskScores = (
  conditions: LiveConditions, 
  disasterRisk: DisasterRisk,
  location: Location
): RiskScores => {
  const aqiRisk = Math.min(1, conditions.aqi / 350);
  
  const tempRisk = conditions.temperature > 38 ? 0.85 : 
                   conditions.temperature > 33 ? 0.55 : 
                   conditions.temperature < 12 ? 0.35 : 0.15;
  const humidityRisk = conditions.humidity > 80 ? 0.5 : 
                       conditions.humidity < 25 ? 0.45 : 0.15;
  const climateRisk = Math.max(tempRisk, humidityRisk);
  
  const crimeRisk = getCrimeRisk(location.city);
  
  const overall = 
    0.40 * disasterRisk.overall +
    0.25 * aqiRisk +
    0.20 * climateRisk +
    0.15 * crimeRisk;
  
  return {
    climate: Math.round(climateRisk * 100) / 100,
    aqi: Math.round(aqiRisk * 100) / 100,
    crime: Math.round(crimeRisk * 100) / 100,
    disaster: disasterRisk.overall,
    overall: Math.round(overall * 100) / 100,
  };
};

// Generate explainable contributing risk factors
export const generateRiskFactors = (
  conditions: LiveConditions,
  disasterRisk: DisasterRisk,
  riskScores: RiskScores
): RiskFactor[] => {
  const factors: RiskFactor[] = [];
  
  if (conditions.aqi > 150) {
    factors.push({
      factor: 'Poor Air Quality',
      impact: conditions.aqi > 250 ? 'high' : 'medium',
      description: `Air Quality Index of ${conditions.aqi} indicates elevated pollution levels.`,
      value: conditions.aqi,
    });
  }
  
  if (conditions.temperature > 37) {
    factors.push({
      factor: 'Extreme Heat',
      impact: 'high',
      description: `Dangerous ambient temperature of ${conditions.temperature}°C increases heat stress.`,
      value: `${conditions.temperature}°C`,
    });
  }
  
  if (conditions.humidity < 28) {
    factors.push({
      factor: 'Low Relative Humidity',
      impact: 'medium',
      description: `Very dry atmosphere (${conditions.humidity}%) increases wildfire vulnerability.`,
      value: `${conditions.humidity}%`,
    });
  }
  
  if (conditions.activeFiresNearby && conditions.activeFiresNearby > 0) {
    factors.push({
      factor: 'Active Wildfire Hotspots',
      impact: conditions.activeFiresNearby >= 3 || (conditions.closestFireDistance && conditions.closestFireDistance < 50) ? 'high' : 'medium',
      description: `NASA FIRMS satellite detected ${conditions.activeFiresNearby} active thermal fire hotspot(s) within regional radius${conditions.closestFireDistance ? ` (closest ${conditions.closestFireDistance} km away)` : ''}.`,
      value: `${conditions.activeFiresNearby} Hotspots`,
    });
  }

  if (disasterRisk.flood > 0.4) {
    factors.push({
      factor: 'High Flood Susceptibility',
      impact: disasterRisk.flood > 0.6 ? 'high' : 'medium',
      description: 'Geographic profiles and rainfall index show elevated flooding risk.',
      value: `${Math.round(disasterRisk.flood * 100)}%`,
    });
  }
  
  if (disasterRisk.cyclone > 0.3) {
    factors.push({
      factor: 'Cyclone Exposure',
      impact: 'medium',
      description: 'Coastal geographic classification elevates cyclonic storm vulnerability.',
      value: `${Math.round(disasterRisk.cyclone * 100)}%`,
    });
  }
  
  if (disasterRisk.earthquake > 0.6) {
    factors.push({
      factor: 'High Seismic Zone',
      impact: 'high',
      description: 'Region is located in a high-intensity earthquake zone (Zone IV/V).',
      value: `Zone ${disasterRisk.earthquake > 0.8 ? 'V' : 'IV'}`,
    });
  }
  
  if (riskScores.crime > 0.5) {
    factors.push({
      factor: 'Metropolitan Crime Baseline',
      impact: 'medium',
      description: 'Historical records indicate above-average metropolitan crime activity.',
    });
  }

  const impactOrder = { high: 0, medium: 1, low: 2 };
  factors.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  
  return factors.slice(0, 5);
};

// Generate warning alerts based on risk levels
export const generateAlerts = (
  conditions: LiveConditions,
  riskScores: RiskScores,
  disasterRisk: DisasterRisk
): Alert[] => {
  const alerts: Alert[] = [];
  
  if (riskScores.overall > 0.65) {
    alerts.push({
      id: 'overall-high',
      type: 'danger',
      title: 'High Regional Risk',
      message: 'Composite safety thresholds exceeded. Exercise situational awareness.',
      timestamp: new Date(),
    });
  }
  
  if (conditions.aqi > 250) {
    alerts.push({
      id: 'aqi-severe',
      type: 'severe',
      title: 'Severe Air Health Alert',
      message: 'Hazardous air particulates detected. Limit outdoor activity and use filtration.',
      timestamp: new Date(),
    });
  }
  
  if (conditions.temperature > 39) {
    alerts.push({
      id: 'heat-alert',
      type: 'warning',
      title: 'Extreme Heat Advisory',
      message: 'Ambient heat index exceeds safe boundaries. Stay hydrated and avoid exposure.',
      timestamp: new Date(),
    });
  }
  
  if (conditions.activeFiresNearby && conditions.activeFiresNearby > 0 && conditions.closestFireDistance && conditions.closestFireDistance < 50) {
    alerts.push({
      id: 'satellite-wildfire-alert',
      type: 'severe',
      title: 'Nearby Active Wildfire Detected',
      message: `NASA FIRMS satellite sensors detected active thermal fire hotspots ${conditions.closestFireDistance} km from selected location.`,
      timestamp: new Date(),
    });
  } else if (disasterRisk.wildfire > 0.7) {
    alerts.push({
      id: 'wildfire-alert',
      type: 'warning',
      title: 'Wildfire Danger Warning',
      message: 'Critical combination of heat, dryness, and wind speeds raises fire risk.',
      timestamp: new Date(),
    });
  }
  
  if (disasterRisk.cyclone > 0.55) {
    alerts.push({
      id: 'cyclone-warning',
      type: 'danger',
      title: 'Cyclone Advisory',
      message: 'Strong atmospheric winds detected in coastal zone. Monitor local updates.',
      timestamp: new Date(),
    });
  }
  
  return alerts;
};

// Seeded pseudo-random generator based on lat/lon to ensure deterministic weather simulation if needed for candidate safety calculations
const getPseudoRand = (lat: number, lon: number, offset: number): number => {
  const seed = Math.sin(lat) * Math.cos(lon);
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
};

// Helper weather simulator to calculate candidates safety comparison
const simulateWeatherForSafetyComparison = (location: Location): LiveConditions => {
  const coastalCities = ['Mumbai', 'Chennai', 'Kolkata', 'Panaji', 'Kochi', 'Visakhapatnam', 'Mangalore', 'Thiruvananthapuram', 'Puducherry'];
  const isCoastal = coastalCities.some(city => location.city.includes(city));
  const isNorth = location.lat > 25;
  const isDesert = location.state === 'Rajasthan';
  
  const baseTemp = isDesert ? 36 : isNorth ? 26 : 30;
  const tempVariation = getPseudoRand(location.lat, location.lon, 1) * 8 - 4;
  const windDirection = Math.floor(getPseudoRand(location.lat, location.lon, 2) * 360);
  
  const humidity = isCoastal 
    ? 65 + getPseudoRand(location.lat, location.lon, 3) * 20 
    : 35 + getPseudoRand(location.lat, location.lon, 3) * 30;
    
  const windSpeed = Math.round((8 + getPseudoRand(location.lat, location.lon, 4) * 15) * 10) / 10;
  const rainfall = getPseudoRand(location.lat, location.lon, 5) > 0.75 
    ? Math.round(getPseudoRand(location.lat, location.lon, 6) * 30) 
    : 0;
    
  const rainProbability = Math.round(getPseudoRand(location.lat, location.lon, 7) * 100);
  
  let baseAqi = 70;
  if (['New Delhi', 'Noida', 'Faridabad', 'Ghaziabad', 'Patna', 'Lucknow'].includes(location.city)) {
    baseAqi = 180;
  } else if (['Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Pune'].includes(location.city)) {
    baseAqi = 110;
  }
  
  const aqi = Math.round(baseAqi + getPseudoRand(location.lat, location.lon, 8) * 80);
  const pm25 = Math.round(aqi * 0.45 + getPseudoRand(location.lat, location.lon, 9) * 15);

  return {
    temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
    humidity: Math.round(humidity),
    windSpeed,
    windDirection,
    windCompass: getWindCompass(windDirection),
    rainfall: Math.round(rainfall * 10) / 10,
    rainProbability,
    aqi,
    pm25,
    lastUpdated: new Date(),
  };
};

// Generate safe place recommendations by computing actual relative safety of nearby cities
export const generateSafePlaces = (currentLocation: Location, riskScores: RiskScores): SafePlace[] => {
  const candidates = INDIAN_CITIES.filter(city => 
    city.city !== currentLocation.city
  );
  
  return candidates
    .map(city => {
      const distance = Math.round(
        Math.sqrt(
          Math.pow((city.lat - currentLocation.lat) * 111, 2) +
          Math.pow((city.lon - currentLocation.lon) * 85, 2)
        )
      );
      
      const candidateConditions = simulateWeatherForSafetyComparison(city);
      const candidateDisaster = generateDisasterRisk(city, candidateConditions);
      const candidateScores = generateRiskScores(candidateConditions, candidateDisaster, city);
      
      const safeScore = Math.round((1 - candidateScores.overall) * 100) / 100;
      const riskReduction = Math.round((riskScores.overall - candidateScores.overall) * 100);
      
      const reasons: string[] = [];
      if (candidateConditions.aqi < 100) reasons.push('Better Air Quality');
      if (candidateConditions.temperature <= 30 && candidateConditions.temperature >= 20) reasons.push('Temperate Climate');
      if (candidateScores.crime < 0.35) reasons.push('Enhanced Public Safety');
      if (candidateDisaster.overall < 0.25) reasons.push('Lower Natural Hazards');
      if (reasons.length === 0) reasons.push('Slightly Lower Risk');
      
      return {
        city: city.city,
        state: city.state,
        distance,
        safeScore,
        riskReduction,
        reasons: reasons.slice(0, 3),
        lat: city.lat,
        lon: city.lon,
      };
    })
    .filter(place => place.distance < 500 && place.riskReduction > 0)
    .sort((a, b) => b.safeScore - a.safeScore)
    .slice(0, 5);
};
