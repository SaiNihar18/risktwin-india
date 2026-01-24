// Location Types
export interface Location {
  lat: number;
  lon: number;
  city: string;
  state: string;
  district?: string;
}

// Weather/Live Conditions
export interface LiveConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windCompass: string;
  rainfall: number;
  rainProbability: number;
  aqi: number;
  pm25: number;
  lastUpdated: Date;
  // Optional wildfire indices from FWI forecast
  wildfireFwi?: number;
  wildfireDanger?: string;
}

// Risk Scores (0-1)
export interface RiskScores {
  climate: number;
  aqi: number;
  crime: number;
  disaster: number;
  overall: number;
}

// Disaster Components
export interface DisasterRisk {
  heatwave: number;
  flood: number;
  wildfire: number;
  cyclone: number;
  earthquake: number;
  overall: number;
}

// Risk Factor for Explainability
export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  value?: string | number;
}

// Safe Place Recommendation
export interface SafePlace {
  city: string;
  state: string;
  distance: number;
  safeScore: number;
  riskReduction: number;
  reasons: string[];
  lat: number;
  lon: number;
}

// Alert
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'severe';
  title: string;
  message: string;
  timestamp: Date;
}

// Heatmap Data Point
export interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number;
  type: 'overall' | 'disaster' | 'aqi' | 'crime';
}

// Map Layer
export interface MapLayer {
  id: string;
  name: string;
  enabled: boolean;
  type: 'heatmap' | 'markers' | 'zones';
}

// Full Analysis Result
export interface AnalysisResult {
  location: Location;
  conditions: LiveConditions;
  riskScores: RiskScores;
  disasterRisk: DisasterRisk;
  riskFactors: RiskFactor[];
  alerts: Alert[];
  safePlaces: SafePlace[];
  confidence: 'high' | 'medium' | 'low';
  dataCompleteness: number;
  analyzedAt: Date;
}

// Risk Level Labels
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const getRiskLevel = (score: number): RiskLevel => {
  if (score < 0.3) return 'LOW';
  if (score < 0.6) return 'MEDIUM';
  return 'HIGH';
};

export const getRiskColor = (score: number): string => {
  if (score < 0.3) return 'risk-low';
  if (score < 0.6) return 'risk-medium';
  return 'risk-high';
};
