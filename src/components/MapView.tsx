import { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, ZoomIn, ZoomOut, Layers, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Location, MapLayer, HeatmapPoint } from '@/types/risk';
import { INDIAN_CITIES } from '@/data/mockData';

interface MapViewProps {
  selectedLocation: Location | null;
  onLocationSelect: (lat: number, lon: number) => void;
  isAnalyzing: boolean;
  heatmapPoints?: HeatmapPoint[];
}

const MapView = ({ 
  selectedLocation, 
  onLocationSelect, 
  isAnalyzing,
  heatmapPoints = []
}: MapViewProps) => {
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'overall', name: 'Overall Risk', enabled: true, type: 'heatmap' },
    { id: 'disaster', name: 'Disaster Risk', enabled: false, type: 'heatmap' },
    { id: 'aqi', name: 'AQI Heatmap', enabled: false, type: 'heatmap' },
    { id: 'crime', name: 'Crime Hotspots', enabled: false, type: 'markers' },
    { id: 'safe', name: 'Safe Zones', enabled: false, type: 'zones' },
  ]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  // India bounds (approximate)
  const INDIA_BOUNDS = {
    north: 35.5,
    south: 6.5,
    east: 97.5,
    west: 68.0,
  };

  const latLonToPosition = useCallback((lat: number, lon: number) => {
    const x = ((lon - INDIA_BOUNDS.west) / (INDIA_BOUNDS.east - INDIA_BOUNDS.west)) * 100;
    const y = ((INDIA_BOUNDS.north - lat) / (INDIA_BOUNDS.north - INDIA_BOUNDS.south)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const positionToLatLon = useCallback((x: number, y: number) => {
    const lon = INDIA_BOUNDS.west + (x / 100) * (INDIA_BOUNDS.east - INDIA_BOUNDS.west);
    const lat = INDIA_BOUNDS.north - (y / 100) * (INDIA_BOUNDS.north - INDIA_BOUNDS.south);
    return { lat, lon };
  }, []);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnalyzing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const { lat, lon } = positionToLatLon(x, y);
    onLocationSelect(lat, lon);
  };

  const handleCityClick = (city: Location) => {
    if (isAnalyzing) return;
    onLocationSelect(city.lat, city.lon);
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, enabled: !l.enabled } : l
    ));
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetView = () => setZoom(1);

  // Generate heatmap gradient overlay
  const generateHeatmapOverlay = () => {
    if (!layers.find(l => l.id === 'overall' && l.enabled)) return null;
    
    // Create a grid of points across India
    const gridPoints: { x: number; y: number; intensity: number }[] = [];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 15; j++) {
        const x = 10 + (i * 7);
        const y = 5 + (j * 6);
        // Simulate intensity based on position (higher in certain regions)
        const intensity = Math.random() * 0.5 + 
          (y > 30 && y < 60 && x > 30 && x < 70 ? 0.3 : 0) + // Central India higher risk
          (y < 20 ? 0.2 : 0); // Northern India higher risk
        gridPoints.push({ x, y, intensity: Math.min(1, intensity) });
      }
    }
    
    return gridPoints.map((point, idx) => (
      <div
        key={idx}
        className="absolute rounded-full pointer-events-none transition-opacity duration-500"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: '8%',
          height: '8%',
          background: `radial-gradient(circle, 
            hsla(${120 - point.intensity * 120}, 80%, 50%, ${point.intensity * 0.4}) 0%, 
            transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    ));
  };

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Map Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">India Risk Map</h2>
          {selectedLocation && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              {selectedLocation.city}, {selectedLocation.state}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layer Control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Layers</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {layers.map(layer => (
                <DropdownMenuCheckboxItem
                  key={layer.id}
                  checked={layer.enabled}
                  onCheckedChange={() => toggleLayer(layer.id)}
                >
                  {layer.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Zoom Controls */}
          <div className="flex items-center bg-secondary/50 rounded-lg border border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomOut}
              className="rounded-r-none"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleZoomIn}
              className="rounded-l-none"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden bg-background/50">
        {/* Map Area */}
        <div 
          ref={mapRef}
          className={`
            absolute inset-4 rounded-xl overflow-hidden cursor-crosshair
            border border-border/30 map-glow transition-transform duration-300
            ${isAnalyzing ? 'pointer-events-none' : ''}
          `}
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            background: 'linear-gradient(180deg, hsl(217 33% 12%), hsl(222 47% 8%))',
          }}
          onClick={handleMapClick}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-primary/30"
                style={{ top: `${(i + 1) * 10}%` }}
              />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-primary/30"
                style={{ left: `${(i + 1) * 10}%` }}
              />
            ))}
          </div>
          
          {/* India Outline (Simplified SVG Path) */}
          <svg 
            className="absolute inset-0 w-full h-full opacity-40"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M30 15 L45 12 L55 15 L65 18 L75 25 L80 35 L78 45 L80 55 L75 65 L70 75 L60 82 L50 85 L40 80 L35 70 L30 60 L25 50 L20 40 L22 30 L30 15 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              className="opacity-50"
            />
          </svg>
          
          {/* Heatmap Overlay */}
          {generateHeatmapOverlay()}
          
          {/* City Markers */}
          {INDIAN_CITIES.map((city) => {
            const pos = latLonToPosition(city.lat, city.lon);
            const isSelected = selectedLocation?.city === city.city;
            
            return (
              <div
                key={city.city}
                className={`
                  absolute transform -translate-x-1/2 -translate-y-1/2 
                  transition-all duration-300 cursor-pointer group z-10
                  ${isSelected ? 'z-20' : ''}
                `}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCityClick(city);
                }}
              >
                <div 
                  className={`
                    relative flex items-center justify-center
                    ${isSelected 
                      ? 'w-6 h-6 bg-primary rounded-full shadow-glow-cyan animate-pulse-glow' 
                      : 'w-3 h-3 bg-primary/60 rounded-full hover:scale-150 hover:bg-primary'
                    }
                    transition-all duration-300
                  `}
                >
                  {isSelected && (
                    <div className="absolute w-10 h-10 rounded-full border-2 border-primary/40 animate-ping" />
                  )}
                </div>
                
                {/* City Label */}
                <div 
                  className={`
                    absolute left-full ml-2 whitespace-nowrap 
                    text-xs font-medium px-2 py-1 rounded bg-secondary/80 border border-border/50
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity duration-200
                    ${isSelected ? 'opacity-100' : ''}
                  `}
                >
                  {city.city}
                </div>
              </div>
            );
          })}
          
          {/* Click Position Marker (if not on a city) */}
          {selectedLocation && !INDIAN_CITIES.find(c => c.city === selectedLocation.city) && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: `${latLonToPosition(selectedLocation.lat, selectedLocation.lon).x}%`,
                top: `${latLonToPosition(selectedLocation.lat, selectedLocation.lon).y}%`,
              }}
            >
              <MapPin className="w-8 h-8 text-primary drop-shadow-lg animate-bounce" />
            </div>
          )}
          
          {/* Analysis Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium text-primary">Analyzing Location</p>
                <p className="text-sm text-muted-foreground">Running multi-risk evaluation...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Instructions Overlay */}
        {!selectedLocation && !isAnalyzing && (
          <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-3 animate-float" />
              <h3 className="text-lg font-semibold mb-1">Select a Location</h3>
              <p className="text-sm text-muted-foreground">
                Click anywhere on the map or select a city to begin analysis
              </p>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-6 left-6 glass-card p-3 text-xs space-y-2">
          <p className="font-medium text-muted-foreground">Risk Legend</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-risk-low" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-risk-medium" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-risk-high" />
              <span>High</span>
            </div>
          </div>
        </div>
        
        {/* Coordinates Display */}
        {selectedLocation && (
          <div className="absolute bottom-6 right-6 glass-card px-3 py-2 text-xs font-mono">
            <span className="text-muted-foreground">LAT:</span>{' '}
            <span className="text-primary">{selectedLocation.lat.toFixed(4)}</span>
            <span className="mx-2 text-border">|</span>
            <span className="text-muted-foreground">LON:</span>{' '}
            <span className="text-primary">{selectedLocation.lon.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
