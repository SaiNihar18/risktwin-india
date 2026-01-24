import { 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  Database,
  Shield
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { RiskFactor } from '@/types/risk';

interface ExplainabilityPanelProps {
  riskFactors: RiskFactor[] | null;
  confidence: 'high' | 'medium' | 'low' | null;
  dataCompleteness: number | null;
  isLoading?: boolean;
}

const FactorCard = ({ factor }: { factor: RiskFactor }) => {
  const getImpactColor = () => {
    switch (factor.impact) {
      case 'high': return 'text-risk-high bg-risk-high/10 border-risk-high/30';
      case 'medium': return 'text-risk-medium bg-risk-medium/10 border-risk-medium/30';
      case 'low': return 'text-risk-low bg-risk-low/10 border-risk-low/30';
    }
  };

  const getImpactIcon = () => {
    switch (factor.impact) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
      <div className={`p-1.5 rounded-lg border ${getImpactColor()}`}>
        {getImpactIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{factor.factor}</span>
          {factor.value && (
            <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-muted-foreground">
              {factor.value}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {factor.description}
        </p>
      </div>
      <span className={`
        text-xs px-2 py-1 rounded-full font-medium capitalize border
        ${getImpactColor()}
      `}>
        {factor.impact}
      </span>
    </div>
  );
};

const SkeletonFactor = () => (
  <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg animate-pulse">
    <div className="w-8 h-8 bg-secondary rounded-lg" />
    <div className="flex-1">
      <div className="w-32 h-4 bg-secondary rounded mb-2" />
      <div className="w-full h-3 bg-secondary rounded" />
    </div>
    <div className="w-16 h-6 bg-secondary rounded-full" />
  </div>
);

const ExplainabilityPanel = ({ 
  riskFactors, 
  confidence, 
  dataCompleteness,
  isLoading = false 
}: ExplainabilityPanelProps) => {
  if (isLoading || !riskFactors) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-data-purple" />
          <h2 className="font-semibold">Why is this area risky?</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonFactor key={i} />
          ))}
        </div>
      </div>
    );
  }

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-risk-low bg-risk-low/10 border-risk-low/30';
      case 'medium': return 'text-risk-medium bg-risk-medium/10 border-risk-medium/30';
      case 'low': return 'text-risk-high bg-risk-high/10 border-risk-high/30';
      default: return 'text-muted-foreground bg-secondary border-border';
    }
  };

  return (
    <div className="glass-card p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-data-purple" />
          <h2 className="font-semibold">Why is this area risky?</h2>
        </div>
        
        {/* Confidence Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${getConfidenceColor()}`}>
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs font-medium uppercase">
            {confidence || 'Unknown'} Confidence
          </span>
        </div>
      </div>

      {/* Top Contributing Factors */}
      {riskFactors.length > 0 ? (
        <div className="space-y-3 mb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Top {riskFactors.length} Contributing Factors
          </p>
          {riskFactors.map((factor, idx) => (
            <FactorCard key={idx} factor={factor} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-5 h-5 mr-2 text-risk-low" />
          <span>No significant risk factors detected</span>
        </div>
      )}

      {/* Data Quality Indicators */}
      <div className="pt-4 border-t border-border/30 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Prediction Confidence */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Prediction Confidence</span>
            </div>
            <div className={`
              text-lg font-bold capitalize
              ${confidence === 'high' ? 'text-risk-low' : 
                confidence === 'medium' ? 'text-risk-medium' : 'text-risk-high'}
            `}>
              {confidence || 'Unknown'}
            </div>
          </div>

          {/* Data Completeness */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Data Completeness</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {dataCompleteness ? Math.round(dataCompleteness * 100) : 0}%
              </span>
              <Progress 
                value={dataCompleteness ? dataCompleteness * 100 : 0} 
                className="flex-1 h-2"
              />
            </div>
          </div>
        </div>

        {/* Trust Notice */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Trust Building:</span> This explainability module helps you understand 
            the reasoning behind risk scores. High confidence indicates strong data support. 
            Always verify critical decisions with official sources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityPanel;
