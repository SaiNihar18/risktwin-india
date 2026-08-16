import { 
  Flame, 
  Waves, 
  Sun, 
  CloudLightning,
  Activity as Seismic,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DisasterRisk } from '@/types/risk';
import { getRiskLevel } from '@/types/risk';

interface DisasterRiskPanelProps {
  disasterRisk: DisasterRisk | null;
  isLoading?: boolean;
}

interface DisasterCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  isCoastalOnly?: boolean;
}

const DisasterCard = ({ icon, label, value, description, isCoastalOnly = false }: DisasterCardProps) => {
  const level = getRiskLevel(value);
  const percentage = Math.round(value * 100);
  
  const getBgColor = () => {
    if (value < 0.3) return 'from-risk-low/10 to-risk-low/5 border-risk-low/30';
    if (value < 0.6) return 'from-risk-medium/10 to-risk-medium/5 border-risk-medium/30';
    return 'from-risk-high/10 to-risk-high/5 border-risk-high/30';
  };

  const getTextColor = () => {
    if (value < 0.3) return 'text-risk-low';
    if (value < 0.6) return 'text-risk-medium';
    return 'text-risk-high';
  };

  const getBarColor = () => {
    if (value < 0.3) return 'bg-risk-low';
    if (value < 0.6) return 'bg-risk-medium';
    return 'bg-risk-high';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={`
            relative overflow-hidden rounded-xl p-4 border cursor-help
            bg-gradient-to-br ${getBgColor()}
            transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
            ${value > 0.6 ? 'animate-pulse' : ''}
          `}
        >
          {/* Coastal Badge */}
          {isCoastalOnly && (
            <span className="absolute top-2 right-2 text-[10px] bg-data-blue/20 text-data-blue px-1.5 py-0.5 rounded font-medium">
              COASTAL
            </span>
          )}
          
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-secondary/50 ${getTextColor()}`}>
              {icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate">{label}</span>
                <span className={`text-lg font-bold ${getTextColor()}`}>
                  {percentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getBarColor()} transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Level Badge */}
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${getTextColor()}`}>
                  {level}
                </span>
                {value > 0.5 && (
                  <AlertTriangle className={`w-3.5 h-3.5 ${getTextColor()}`} />
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const SkeletonCard = () => (
  <div className="rounded-xl p-4 border border-border/30 bg-secondary/20 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-secondary rounded-lg" />
      <div className="flex-1">
        <div className="flex justify-between mb-2">
          <div className="w-20 h-4 bg-secondary rounded" />
          <div className="w-10 h-4 bg-secondary rounded" />
        </div>
        <div className="h-1.5 bg-secondary rounded-full" />
        <div className="w-12 h-3 bg-secondary rounded mt-2" />
      </div>
    </div>
  </div>
);

const DisasterRiskPanel = ({ disasterRisk, isLoading = false }: DisasterRiskPanelProps) => {
  if (isLoading || !disasterRisk) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-data-orange" />
          <h2 className="font-semibold">Disaster Risk Assessment</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const overallLevel = getRiskLevel(disasterRisk.overall);
  const overallPercentage = Math.round(disasterRisk.overall * 100);

  return (
    <div className="glass-card p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-data-orange" />
          <h2 className="font-semibold">Disaster Risk Assessment</h2>
        </div>
        
        {/* Overall Disaster Score */}
        <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/30">
          <span className="text-xs text-muted-foreground">Overall:</span>
          <span className={`
            text-lg font-bold
            ${disasterRisk.overall < 0.3 ? 'text-risk-low' : 
              disasterRisk.overall < 0.6 ? 'text-risk-medium' : 'text-risk-high'}
          `}>
            {overallPercentage}%
          </span>
          <span className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${disasterRisk.overall < 0.3 ? 'badge-risk-low' : 
              disasterRisk.overall < 0.6 ? 'badge-risk-medium' : 'badge-risk-high'}
          `}>
            {overallLevel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <DisasterCard
          icon={<Sun className="w-5 h-5" />}
          label="Heatwave Risk"
          value={disasterRisk.heatwave}
          description="Risk of extreme heat events based on current temperature, humidity, and historical patterns. High temperatures can cause heat stroke and infrastructure stress."
        />
        
        <DisasterCard
          icon={<Waves className="w-5 h-5" />}
          label="Flood Risk"
          value={disasterRisk.flood}
          description="Flood susceptibility based on rainfall, terrain, drainage systems, and proximity to water bodies. Includes risk of flash floods and riverine flooding."
        />
        
        <DisasterCard
          icon={<Flame className="w-5 h-5" />}
          label="Wildfire Risk"
          value={disasterRisk.wildfire}
          description={
            disasterRisk.activeFiresNearby && disasterRisk.activeFiresNearby > 0
              ? `NASA FIRMS satellite detected ${disasterRisk.activeFiresNearby} active thermal fire hotspot(s) in region${disasterRisk.closestFireDistance ? ` (${disasterRisk.closestFireDistance}km away)` : ''}. Blended with Chandler Burning Index based on temperature, humidity, and wind.`
              : "Fire danger evaluated via Chandler Burning Index (CBI) & NASA FIRMS satellite surveillance based on temperature, humidity, wind velocity, and active thermal anomalies."
          }
        />
        
        <DisasterCard
          icon={<CloudLightning className="w-5 h-5" />}
          label="Cyclone Risk"
          value={disasterRisk.cyclone}
          description="Tropical cyclone threat for coastal regions. Based on seasonal patterns, sea surface temperatures, and atmospheric conditions."
          isCoastalOnly
        />
        
        <DisasterCard
          icon={<Seismic className="w-5 h-5" />}
          label="Earthquake Risk"
          value={disasterRisk.earthquake}
          description="Seismic risk based on tectonic zone location and historical earthquake data. India has several seismically active regions."
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> These scores represent disaster susceptibility based on environmental conditions and historical data. 
            They are not exact predictions. Always follow official disaster management advisories from NDMA and local authorities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisasterRiskPanel;
