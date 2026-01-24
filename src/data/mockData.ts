import type { 
  Location, 
  LiveConditions, 
  RiskScores, 
  DisasterRisk, 
  RiskFactor, 
  SafePlace, 
  Alert,
  AnalysisResult 
} from '@/types/risk';

// Major Indian Cities with coordinates
export const INDIAN_CITIES: Location[] = [
  { lat: 28.6139, lon: 77.2090, city: 'New Delhi', state: 'Delhi' },
  { lat: 19.0760, lon: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
  { lat: 13.0827, lon: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
  { lat: 12.9716, lon: 77.5946, city: 'Bangalore', state: 'Karnataka' },
  { lat: 22.5726, lon: 88.3639, city: 'Kolkata', state: 'West Bengal' },
  { lat: 23.0225, lon: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
  { lat: 17.3850, lon: 78.4867, city: 'Hyderabad', state: 'Telangana' },
  { lat: 18.5204, lon: 73.8567, city: 'Pune', state: 'Maharashtra' },
  { lat: 26.9124, lon: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
  { lat: 26.8467, lon: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh' },
  { lat: 21.1702, lon: 72.8311, city: 'Surat', state: 'Gujarat' },
  { lat: 15.2993, lon: 74.1240, city: 'Goa', state: 'Goa' },
  { lat: 30.7333, lon: 76.7794, city: 'Chandigarh', state: 'Chandigarh' },
  { lat: 25.5941, lon: 85.1376, city: 'Patna', state: 'Bihar' },
  { lat: 20.2961, lon: 85.8245, city: 'Bhubaneswar', state: 'Odisha' },
];

// Wind direction to compass
export const getWindCompass = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Generate mock conditions based on location
export const generateMockConditions = (location: Location): LiveConditions => {
  // Simulate regional variations
  const isCoastal = ['Mumbai', 'Chennai', 'Kolkata', 'Goa', 'Bhubaneswar'].includes(location.city);
  const isNorth = location.lat > 25;
  const isDesert = location.state === 'Rajasthan';
  
  const baseTemp = isDesert ? 38 : isNorth ? 28 : 32;
  const tempVariation = Math.random() * 8 - 4;
  
  const windDirection = Math.floor(Math.random() * 360);
  
  return {
    temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
    humidity: isCoastal ? 70 + Math.random() * 20 : 40 + Math.random() * 30,
    windSpeed: Math.round((10 + Math.random() * 25) * 10) / 10,
    windDirection,
    windCompass: getWindCompass(windDirection),
    rainfall: Math.random() > 0.7 ? Math.round(Math.random() * 50) : 0,
    rainProbability: Math.round(Math.random() * 100),
    aqi: Math.round(50 + Math.random() * 300),
    pm25: Math.round(20 + Math.random() * 200),
    lastUpdated: new Date(),
  };
};

// Generate disaster risk based on location
export const generateDisasterRisk = (location: Location, conditions: LiveConditions): DisasterRisk => {
  const isCoastal = ['Mumbai', 'Chennai', 'Kolkata', 'Goa', 'Bhubaneswar'].includes(location.city);
  const isFloodProne = ['Patna', 'Kolkata', 'Mumbai', 'Chennai'].includes(location.city);
  const isHeatProne = conditions.temperature > 35;
  
  const heatwave = isHeatProne 
    ? 0.5 + (conditions.temperature - 35) * 0.1 
    : 0.1 + Math.random() * 0.2;
  
  const flood = isFloodProne 
    ? 0.4 + conditions.rainfall * 0.01 
    : 0.1 + Math.random() * 0.2;
  
  const wildfire = conditions.humidity < 40 && conditions.temperature > 35 
    ? 0.4 + Math.random() * 0.3 
    : 0.1 + Math.random() * 0.2;
  
  const cyclone = isCoastal 
    ? 0.3 + Math.random() * 0.4 
    : 0.05;
  
  const earthquake = Math.random() * 0.3; // Generally low
  
  const overall = Math.max(heatwave, flood, wildfire, cyclone, earthquake);
  
  return {
    heatwave: Math.min(1, Math.round(heatwave * 100) / 100),
    flood: Math.min(1, Math.round(flood * 100) / 100),
    wildfire: Math.min(1, Math.round(wildfire * 100) / 100),
    cyclone: Math.min(1, Math.round(cyclone * 100) / 100),
    earthquake: Math.min(1, Math.round(earthquake * 100) / 100),
    overall: Math.min(1, Math.round(overall * 100) / 100),
  };
};

// Generate risk scores
export const generateRiskScores = (
  conditions: LiveConditions, 
  disasterRisk: DisasterRisk
): RiskScores => {
  // AQI Risk (0-1)
  const aqiRisk = Math.min(1, conditions.aqi / 400);
  
  // Climate Risk based on extreme conditions
  const tempRisk = conditions.temperature > 40 ? 0.8 : 
                   conditions.temperature > 35 ? 0.5 : 
                   conditions.temperature < 10 ? 0.4 : 0.2;
  const humidityRisk = conditions.humidity > 85 ? 0.6 : 
                       conditions.humidity < 20 ? 0.5 : 0.2;
  const climateRisk = Math.max(tempRisk, humidityRisk);
  
  // Crime Risk (mock - would come from actual data)
  const crimeRisk = 0.2 + Math.random() * 0.4;
  
  // Overall Risk Calculation
  // Overall = 0.40 × Disaster + 0.25 × AQI + 0.20 × Climate + 0.15 × Crime
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

// Generate risk factors for explainability
export const generateRiskFactors = (
  conditions: LiveConditions,
  disasterRisk: DisasterRisk,
  riskScores: RiskScores
): RiskFactor[] => {
  const factors: RiskFactor[] = [];
  
  if (conditions.aqi > 200) {
    factors.push({
      factor: 'High Air Quality Index',
      impact: 'high',
      description: 'AQI exceeds safe levels, indicating severe air pollution',
      value: conditions.aqi,
    });
  }
  
  if (conditions.temperature > 38) {
    factors.push({
      factor: 'Extreme Temperature',
      impact: 'high',
      description: 'Temperature is dangerously high, increasing heat-related risks',
      value: `${conditions.temperature}°C`,
    });
  }
  
  if (conditions.humidity < 30) {
    factors.push({
      factor: 'Low Humidity',
      impact: 'medium',
      description: 'Very dry conditions increase wildfire susceptibility',
      value: `${Math.round(conditions.humidity)}%`,
    });
  }
  
  if (disasterRisk.flood > 0.5) {
    factors.push({
      factor: 'Flood Vulnerability',
      impact: 'high',
      description: 'Area is prone to flooding based on terrain and rainfall patterns',
      value: `${Math.round(disasterRisk.flood * 100)}%`,
    });
  }
  
  if (disasterRisk.cyclone > 0.4) {
    factors.push({
      factor: 'Cyclone Exposure',
      impact: 'high',
      description: 'Coastal location with elevated cyclone risk',
      value: `${Math.round(disasterRisk.cyclone * 100)}%`,
    });
  }
  
  if (conditions.windSpeed > 30) {
    factors.push({
      factor: 'High Wind Speed',
      impact: 'medium',
      description: 'Strong winds may cause structural damage',
      value: `${conditions.windSpeed} km/h`,
    });
  }
  
  if (riskScores.crime > 0.4) {
    factors.push({
      factor: 'Elevated Crime Baseline',
      impact: 'medium',
      description: 'Historical crime data indicates above-average incidents',
    });
  }
  
  if (conditions.pm25 > 100) {
    factors.push({
      factor: 'High PM2.5 Levels',
      impact: 'high',
      description: 'Fine particulate matter exceeds safe breathing thresholds',
      value: `${conditions.pm25} µg/m³`,
    });
  }
  
  // Sort by impact
  const impactOrder = { high: 0, medium: 1, low: 2 };
  factors.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  
  return factors.slice(0, 5);
};

// Generate alerts
export const generateAlerts = (
  conditions: LiveConditions,
  riskScores: RiskScores,
  disasterRisk: DisasterRisk
): Alert[] => {
  const alerts: Alert[] = [];
  
  if (riskScores.overall > 0.7) {
    alerts.push({
      id: 'overall-high',
      type: 'danger',
      title: 'High Risk Alert',
      message: 'Overall risk level is elevated. Exercise caution and monitor conditions.',
      timestamp: new Date(),
    });
  }
  
  if (conditions.aqi > 300) {
    alerts.push({
      id: 'aqi-severe',
      type: 'severe',
      title: 'Air Health Alert',
      message: 'AQI is in severe range. Limit outdoor exposure, use air purifiers.',
      timestamp: new Date(),
    });
  }
  
  if (conditions.temperature > 40) {
    alerts.push({
      id: 'heat-alert',
      type: 'warning',
      title: 'Heat Alert',
      message: 'Temperature exceeds 40°C. Stay hydrated, avoid direct sunlight.',
      timestamp: new Date(),
    });
  }
  
  if (disasterRisk.overall > 0.75) {
    alerts.push({
      id: 'disaster-warning',
      type: 'danger',
      title: 'Disaster Warning',
      message: 'High disaster susceptibility detected. Review emergency preparedness.',
      timestamp: new Date(),
    });
  }
  
  if (disasterRisk.cyclone > 0.6) {
    alerts.push({
      id: 'cyclone-warning',
      type: 'danger',
      title: 'Cyclone Advisory',
      message: 'Elevated cyclone risk for coastal regions. Monitor weather updates.',
      timestamp: new Date(),
    });
  }
  
  return alerts;
};

// Generate safe place recommendations
export const generateSafePlaces = (currentLocation: Location, riskScores: RiskScores): SafePlace[] => {
  // Find cities with lower risk
  const candidates = INDIAN_CITIES.filter(city => 
    city.city !== currentLocation.city
  );
  
  return candidates
    .map(city => {
      // Calculate distance (simplified)
      const distance = Math.round(
        Math.sqrt(
          Math.pow((city.lat - currentLocation.lat) * 111, 2) +
          Math.pow((city.lon - currentLocation.lon) * 85, 2)
        )
      );
      
      // Mock safe score - inverse of current risk + some variation
      const safeScore = Math.round((0.9 - riskScores.overall * 0.5 + Math.random() * 0.3) * 100) / 100;
      
      const reasons: string[] = [];
      if (Math.random() > 0.5) reasons.push('Lower AQI levels');
      if (Math.random() > 0.5) reasons.push('Moderate temperature');
      if (Math.random() > 0.5) reasons.push('Lower crime rate');
      if (Math.random() > 0.5) reasons.push('Better infrastructure');
      if (reasons.length === 0) reasons.push('Overall safer conditions');
      
      return {
        city: city.city,
        state: city.state,
        distance,
        safeScore,
        riskReduction: Math.round((riskScores.overall - (1 - safeScore)) * 100),
        reasons: reasons.slice(0, 3),
        lat: city.lat,
        lon: city.lon,
      };
    })
    .filter(place => place.distance < 500)
    .sort((a, b) => b.safeScore - a.safeScore)
    .slice(0, 5);
};

// Find nearest city from coordinates
export const findNearestCity = (lat: number, lon: number): Location => {
  let nearest = INDIAN_CITIES[0];
  let minDistance = Infinity;
  
  INDIAN_CITIES.forEach(city => {
    const distance = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  });
  
  return {
    lat,
    lon,
    city: nearest.city,
    state: nearest.state,
    district: nearest.city + ' District',
  };
};

// Full analysis function
export const analyzeLocation = (lat: number, lon: number): AnalysisResult => {
  const location = findNearestCity(lat, lon);
  const conditions = generateMockConditions(location);
  const disasterRisk = generateDisasterRisk(location, conditions);
  const riskScores = generateRiskScores(conditions, disasterRisk);
  const riskFactors = generateRiskFactors(conditions, disasterRisk, riskScores);
  const alerts = generateAlerts(conditions, riskScores, disasterRisk);
  const safePlaces = generateSafePlaces(location, riskScores);
  
  return {
    location,
    conditions,
    riskScores,
    disasterRisk,
    riskFactors,
    alerts,
    safePlaces,
    confidence: riskFactors.length > 3 ? 'high' : riskFactors.length > 1 ? 'medium' : 'low',
    dataCompleteness: 0.85 + Math.random() * 0.15,
    analyzedAt: new Date(),
  };
};
