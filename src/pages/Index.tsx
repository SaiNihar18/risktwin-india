import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import MapView from '@/components/MapView';
import LocationSelector from '@/components/LocationSelector';
import LiveConditionsPanel from '@/components/LiveConditionsPanel';
import RiskAnalysisPanel from '@/components/RiskAnalysisPanel';
import DisasterRiskPanel from '@/components/DisasterRiskPanel';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';
import SafePlaceRecommender from '@/components/SafePlaceRecommender';
import AlertSystem from '@/components/AlertSystem';
import { 
  INDIAN_CITIES,
  findNearestCity,
} from '@/data/locations';
import {
  generateDisasterRisk,
  generateRiskScores,
  generateRiskFactors,
  generateAlerts,
  generateSafePlaces,
} from '@/services/riskAnalysis';
import { fetchLiveConditions } from '@/services/weatherApi';
import type { AnalysisResult, Location, SafePlace } from '@/types/risk';

const Index = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Handle location selection
  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setIsAnalyzing(true);
    setApiError(null);
    
    try {
      const location = findNearestCity(lat, lon);
      setSelectedLocation(location);

      // Fetch real conditions from APIs
      const liveConditions = await fetchLiveConditions(lat, lon);

      if (liveConditions) {
        // Use real data to calculate risks
        const disasterRisk = generateDisasterRisk(location, liveConditions);
        const riskScores = generateRiskScores(liveConditions, disasterRisk, location);
        const riskFactors = generateRiskFactors(liveConditions, disasterRisk, riskScores);
        const alerts = generateAlerts(liveConditions, riskScores, disasterRisk);
        const safePlaces = generateSafePlaces(location, riskScores);

        setAnalysisResult({
          location,
          conditions: liveConditions,
          riskScores,
          disasterRisk,
          riskFactors,
          alerts,
          safePlaces,
          confidence: riskFactors.length > 3 ? 'high' : riskFactors.length > 1 ? 'medium' : 'low',
          dataCompleteness: 0.95,
          analyzedAt: new Date(),
        });
      } else {
        const errorText = 'API returned empty weather parameters. Verify OpenWeatherMap API key.';
        setApiError(errorText);
        setAnalysisResult(null);
      }
    } catch (error: unknown) {
      console.error('API fetch failed:', error);
      const err = error as Error | { message?: string };
      const msg = typeof err?.message === 'string' ? err.message : 'Live API fetch failed';
      let errorText = 'Live data fetch failed. Check network connection or API service status.';
      
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        errorText = 'API unauthorized (401). Please check that your OpenWeatherMap key is active and correctly configured.';
        toast.error('API unauthorized (401). Please verify key.');
      } else {
        toast.error(errorText);
      }
      setApiError(errorText);
      setAnalysisResult(null);
    }
    
    setIsAnalyzing(false);
  }, []);

  // Handle safe place selection
  const handleSafePlaceSelect = useCallback((place: SafePlace) => {
    handleLocationSelect(place.lat, place.lon);
  }, [handleLocationSelect]);

  return (
    <div className="min-h-screen bg-gradient-hero transition-colors duration-300">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Sleek Hero Dashboard Title */}
        <div className="mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Digital Twin Active Telemetry
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-muted-foreground/80 to-foreground bg-clip-text text-transparent">
            Multi-Hazard Climate & Public Safety Surveillance
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Surveillance of environmental hazards, seismic activity, air pollution indexes, and public safety parameters across India. Click the map or search to analyze.
          </p>
        </div>

        {apiError && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 shadow-glow-destructive">
            <span className="w-2 h-2 mt-1.5 rounded-full bg-destructive animate-pulse" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Live Sync Suspended</p>
              <p className="text-xs text-muted-foreground">{apiError}</p>
            </div>
          </div>
        )}

        {/* Alerts - Always when present */}
        {analysisResult && analysisResult.alerts.length > 0 && (
          <div className="mb-6">
            <AlertSystem alerts={analysisResult.alerts} />
          </div>
        )}
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map - large, centered, with floating location selector */}
            <div className="h-[560px] rounded-2xl overflow-hidden border border-border/20 shadow-glow relative">
              <MapView
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                isAnalyzing={isAnalyzing}
                activeFires={analysisResult?.conditions.activeFiresList}
              />
              
              {/* Floating Location Selector */}
              <div className="absolute top-4 left-4 z-[400] w-[320px] sm:w-[380px]">
                <LocationSelector
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  disabled={isAnalyzing}
                  className="bg-card/90 backdrop-blur-xl border-border/40 shadow-elevated"
                />
              </div>
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
              <span className="text-border">|</span>
              <span>Last Data Sync: Real-time</span>
              <span className="text-border">|</span>
              <span>Version 1.0.0</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="font-medium text-foreground mb-1">RiskTwin India</p>
              <p>Multi-Risk Digital Twin for Climate, Disaster, Air Quality & Public Safety</p>
              <p className="mt-1 text-muted-foreground/70">
                Live Mode: Fetching real-time telemetry from OpenWeatherMap & NASA FIRMS VIIRS Satellite APIs
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
