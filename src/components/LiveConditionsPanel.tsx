import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Compass, 
  CloudRain, 
  Gauge,
  Clock,
  Leaf
} from 'lucide-react';
import type { LiveConditions } from '@/types/risk';
import { format } from 'date-fns';

interface LiveConditionsPanelProps {
  conditions: LiveConditions | null;
  isLoading?: boolean;
}

interface ConditionCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  status?: 'good' | 'moderate' | 'poor' | 'severe';
}

const ConditionCard = ({ icon, label, value, unit, subValue, status = 'good' }: ConditionCardProps) => {
  const statusColors = {
    good: 'text-risk-low',
    moderate: 'text-risk-medium',
    poor: 'text-data-orange',
    severe: 'text-risk-high',
  };

  return (
    <div className="data-card flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">{icon}</div>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${statusColors[status]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      {subValue && (
        <span className="text-xs text-muted-foreground mt-1">{subValue}</span>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="data-card animate-pulse">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-5 h-5 bg-secondary rounded" />
      <div className="w-16 h-3 bg-secondary rounded" />
    </div>
    <div className="w-20 h-7 bg-secondary rounded mb-1" />
    <div className="w-12 h-3 bg-secondary rounded" />
  </div>
);

const getAQIStatus = (aqi: number): 'good' | 'moderate' | 'poor' | 'severe' => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 200) return 'poor';
  return 'severe';
};

const getAQILabel = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const getTempStatus = (temp: number): 'good' | 'moderate' | 'poor' | 'severe' => {
  if (temp >= 20 && temp <= 30) return 'good';
  if (temp >= 15 && temp <= 35) return 'moderate';
  if (temp >= 10 && temp <= 40) return 'poor';
  return 'severe';
};

const LiveConditionsPanel = ({ conditions, isLoading = false }: LiveConditionsPanelProps) => {
  if (isLoading || !conditions) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Live Conditions
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          Live Conditions
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {format(conditions.lastUpdated, 'HH:mm:ss')}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ConditionCard
          icon={<Thermometer className="w-5 h-5" />}
          label="Temperature"
          value={conditions.temperature}
          unit="°C"
          subValue={conditions.temperature > 35 ? 'Above normal' : 'Normal range'}
          status={getTempStatus(conditions.temperature)}
        />
        
        <ConditionCard
          icon={<Droplets className="w-5 h-5" />}
          label="Humidity"
          value={Math.round(conditions.humidity)}
          unit="%"
          subValue={conditions.humidity > 70 ? 'High moisture' : 'Comfortable'}
          status={conditions.humidity > 80 ? 'poor' : conditions.humidity < 30 ? 'moderate' : 'good'}
        />
        
        <ConditionCard
          icon={<Wind className="w-5 h-5" />}
          label="Wind Speed"
          value={conditions.windSpeed}
          unit="km/h"
          subValue={conditions.windSpeed > 30 ? 'Strong winds' : 'Light breeze'}
          status={conditions.windSpeed > 40 ? 'severe' : conditions.windSpeed > 25 ? 'moderate' : 'good'}
        />
        
        <ConditionCard
          icon={<Compass className="w-5 h-5" />}
          label="Wind Direction"
          value={conditions.windCompass}
          subValue={`${conditions.windDirection}° bearing`}
          status="good"
        />
        
        <ConditionCard
          icon={<CloudRain className="w-5 h-5" />}
          label="Rainfall"
          value={conditions.rainfall}
          unit="mm"
          subValue={`${conditions.rainProbability}% probability`}
          status={conditions.rainfall > 30 ? 'poor' : conditions.rainfall > 10 ? 'moderate' : 'good'}
        />
        
        <ConditionCard
          icon={<CloudRain className="w-5 h-5" />}
          label="Rain Probability"
          value={conditions.rainProbability}
          unit="%"
          subValue={conditions.rainProbability > 70 ? 'Likely rain' : 'Low chance'}
          status={conditions.rainProbability > 80 ? 'poor' : conditions.rainProbability > 50 ? 'moderate' : 'good'}
        />
        
        <ConditionCard
          icon={<Leaf className="w-5 h-5" />}
          label="AQI"
          value={conditions.aqi}
          subValue={getAQILabel(conditions.aqi)}
          status={getAQIStatus(conditions.aqi)}
        />
        
        <ConditionCard
          icon={<Gauge className="w-5 h-5" />}
          label="PM2.5"
          value={conditions.pm25}
          unit="µg/m³"
          subValue={conditions.pm25 > 60 ? 'Above safe limit' : 'Safe levels'}
          status={conditions.pm25 > 150 ? 'severe' : conditions.pm25 > 60 ? 'poor' : conditions.pm25 > 30 ? 'moderate' : 'good'}
        />
      </div>
      
      {/* Data Source Notice */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          📡 Data sources: Weather API • Air Quality Monitoring • Satellite Imagery
          <span className="mx-2">|</span>
          <span className="text-primary">Demo Mode: Using simulated data</span>
        </p>
      </div>
    </div>
  );
};

export default LiveConditionsPanel;
