import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import LocationSelector from '@/components/LocationSelector';
import LiveConditionsPanel from '@/components/LiveConditionsPanel';
import RiskAnalysisPanel from '@/components/RiskAnalysisPanel';
import DisasterRiskPanel from '@/components/DisasterRiskPanel';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';
import SafePlaceRecommender from '@/components/SafePlaceRecommender';
import AlertSystem from '@/components/AlertSystem';
import { analyzeLocation, INDIAN_CITIES } from '@/data/mockData';
import type { AnalysisResult, Location, SafePlace } from '@/types/risk';

const Index = () => {
  const [demoMode, setDemoMode] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle location selection
  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = analyzeLocation(lat, lon);
    setSelectedLocation(result.location);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  }, []);

  // Handle safe place selection
  const handleSafePlaceSelect = useCallback((place: SafePlace) => {
    handleLocationSelect(place.lat, place.lon);
  }, [handleLocationSelect]);

  // Auto-select Delhi on demo mode for immediate showcase
  useEffect(() => {
    if (demoMode && !selectedLocation) {
      const delhi = INDIAN_CITIES.find(c => c.city === 'New Delhi');
      if (delhi) {
        handleLocationSelect(delhi.lat, delhi.lon);
      }
    }
  }, [demoMode]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header demoMode={demoMode} onDemoModeChange={setDemoMode} />
      
      <main className="container mx-auto px-4 py-6">
        {/* Alerts - Always on top when present */}
        {analysisResult && analysisResult.alerts.length > 0 && (
          <div className="mb-6">
            <AlertSystem alerts={analysisResult.alerts} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map & Location */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="h-[500px]">
              <MapView
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Live Conditions */}
            <LiveConditionsPanel 
              conditions={analysisResult?.conditions || null}
              isLoading={isAnalyzing}
            />

            {/* Disaster Risk */}
            <DisasterRiskPanel 
              disasterRisk={analysisResult?.disasterRisk || null}
              isLoading={isAnalyzing}
            />
          </div>

          {/* Right Column - Analysis & Recommendations */}
          <div className="space-y-6">
            {/* Location Selector */}
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              disabled={isAnalyzing}
            />

            {/* Risk Analysis */}
            <RiskAnalysisPanel 
              riskScores={analysisResult?.riskScores || null}
              isLoading={isAnalyzing}
            />

            {/* Explainability */}
            <ExplainabilityPanel
              riskFactors={analysisResult?.riskFactors || null}
              confidence={analysisResult?.confidence || null}
              dataCompleteness={analysisResult?.dataCompleteness || null}
              isLoading={isAnalyzing}
            />

            {/* Safe Place Recommender */}
            <SafePlaceRecommender
              safePlaces={analysisResult?.safePlaces || null}
              currentLocation={selectedLocation}
              onPlaceSelect={handleSafePlaceSelect}
              isLoading={isAnalyzing}
            />
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-8 py-6 border-t border-border/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
                System Operational
              </span>
              <span>|</span>
              <span>Last Data Sync: Real-time</span>
              <span>|</span>
              <span>Version 1.0.0</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="font-medium text-foreground mb-1">RiskTwin India</p>
              <p>Multi-Risk Digital Twin for Climate, Disaster, Air Quality & Public Safety</p>
              <p className="mt-1 text-muted-foreground/70">
                Demo Mode: Using simulated data for demonstration purposes
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
