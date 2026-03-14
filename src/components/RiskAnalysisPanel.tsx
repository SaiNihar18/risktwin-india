import { Activity, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RiskScores } from '@/types/risk';
import { getRiskLevel } from '@/types/risk';

interface RiskAnalysisPanelProps {
  riskScores: RiskScores | null;
  isLoading?: boolean;
}

interface RiskBarProps {
  label: string;
  value: number | null;
  weight: string;
  description: string;
}

const RiskBar = ({ label, value, weight, description }: RiskBarProps) => {
  if (value === null) {
    return (
      <div className="space-y-2 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{label}</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground transition-colors hover:text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{description}</p>
                <p className="text-xs text-muted-foreground mt-1">Weight: {weight}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">N/A</span>
        </div>
        <div className="risk-progress">
          <div className="risk-progress-bar bg-secondary" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  const level = getRiskLevel(value);
  const percentage = Math.round(value * 100);
  
  const getBarColor = () => {
    if (value < 0.3) return 'bg-risk-low';
    if (value < 0.6) return 'bg-risk-medium';
    return 'bg-risk-high';
  };

  const getBadgeClass = () => {
    if (value < 0.3) return 'badge-risk-low';
    if (value < 0.6) return 'badge-risk-medium';
    return 'badge-risk-high';
  };

  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{label}</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground transition-colors hover:text-primary" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{description}</p>
              <p className="text-xs text-muted-foreground mt-1">Weight: {weight}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground">{percentage}%</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeClass()}`}>
            {level}
          </span>
        </div>
      </div>
      <div className="risk-progress">
        <div 
          className={`risk-progress-bar ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const SkeletonBar = () => (
  <div className="space-y-2 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-24 h-4 bg-secondary rounded" />
      <div className="w-16 h-5 bg-secondary rounded" />
    </div>
    <div className="h-2 bg-secondary rounded-full" />
  </div>
);

const RiskAnalysisPanel = ({ riskScores, isLoading = false }: RiskAnalysisPanelProps) => {
  if (isLoading || !riskScores) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Multi-Risk Analysis</h2>
        </div>
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBar key={i} />
          ))}
        </div>
      </div>
    );
  }

  const overallLevel = getRiskLevel(riskScores.overall);
  const overallPercentage = Math.round(riskScores.overall * 100);

  const getOverallColor = () => {
    if (riskScores.overall < 0.3) return 'from-risk-low to-emerald-400';
    if (riskScores.overall < 0.6) return 'from-risk-medium to-amber-400';
    return 'from-risk-high to-red-400';
  };

  const getOverallBg = () => {
    if (riskScores.overall < 0.3) return 'from-risk-low/10 to-risk-low/5';
    if (riskScores.overall < 0.6) return 'from-risk-medium/10 to-risk-medium/5';
    return 'from-risk-high/10 to-risk-high/5';
  };

  return (
    <div className="glass-card p-5 fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Activity className="w-4 h-4 text-primary-foreground" />
        </div>
        <h2 className="font-semibold text-foreground">Multi-Risk Analysis</h2>
      </div>

      {/* Overall Risk Score - Hero Display */}
      <div className={`bg-gradient-to-br ${getOverallBg()} rounded-xl p-5 mb-6 border border-border/50`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Overall Risk Score</span>
          </div>
          {riskScores.overall > 0.6 && (
            <div className="flex items-center gap-1 text-risk-high animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">ELEVATED</span>
            </div>
          )}
        </div>
        
        <div className="flex items-end gap-4">
          <div className={`text-5xl font-bold bg-gradient-to-r ${getOverallColor()} bg-clip-text text-transparent`}>
            {overallPercentage}%
          </div>
          <div className="pb-1">
            <div className={`
              text-sm font-semibold px-3 py-1 rounded-full
              ${riskScores.overall < 0.3 ? 'bg-risk-low/20 text-risk-low' : 
                riskScores.overall < 0.6 ? 'bg-risk-medium/20 text-risk-medium' : 
                'bg-risk-high/20 text-risk-high'}
            `}>
              {overallLevel} RISK
            </div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-4 h-3 rounded-full bg-secondary overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${getOverallColor()} transition-all duration-1000 ease-out`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        
        {/* Risk Formula */}
        <div className="mt-3 p-2 bg-card/50 rounded-lg border border-border/30">
          <p className="text-xs text-muted-foreground text-center font-mono">
            Overall uses weighted average of available live components.
          </p>
        </div>
      </div>

      {/* Individual Risk Components */}
      <div className="space-y-5">
        <RiskBar 
          label="Disaster Risk"
          value={riskScores.disaster}
          weight="40%"
          description="Combined risk from heatwaves, floods, wildfires, cyclones, and earthquakes based on geographic and seasonal factors."
        />
        
        <RiskBar 
          label="AQI Risk"
          value={riskScores.aqi}
          weight="25%"
          description="Air quality health risk based on current AQI, PM2.5 levels, and pollutant concentrations."
        />
        
        <RiskBar 
          label="Climate Risk"
          value={riskScores.climate}
          weight="20%"
          description="Risk from extreme temperatures, humidity levels, and weather conditions that may impact health and safety."
        />
        
        <RiskBar 
          label="Crime Risk"
          value={riskScores.crime}
          weight="15%"
          description="Public safety risk based on historical crime data, population density, and urban safety indicators."
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-5 p-3 bg-secondary/30 rounded-lg border border-border/30">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Risk scores represent susceptibility levels based on available data. 
            This is a decision-support tool, not an exact prediction system.
            Always consult official sources for emergency decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisPanel;
