import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Target, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Location, MapLayer } from '@/types/risk';
import { INDIAN_CITIES } from '@/data/mockData';
import { useTheme } from '@/hooks/useTheme';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, size: number = 12) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; 
      height: ${size}px; 
      background: ${color}; 
      border-radius: 50%; 
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 0 12px ${color}80, 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const selectedIcon = L.divIcon({
  className: 'selected-marker',
  html: `<div class="selected-marker-inner">
    <div style="
      width: 22px; 
      height: 22px; 
      background: linear-gradient(135deg, #3B82F6, #14B8A6); 
      border-radius: 50%; 
      border: 3px solid white;
      box-shadow: 0 0 24px rgba(59, 130, 246, 0.6), 0 4px 12px rgba(0,0,0,0.4);
      animation: pulse 2s infinite;
    "></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const cityIcon = createCustomIcon('#10B981', 10);

interface MapViewProps {
  selectedLocation: Location | null;
  onLocationSelect: (lat: number, lon: number, location?: Location) => void;
  isAnalyzing: boolean;
}

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect, isAnalyzing }: { 
  onLocationSelect: (lat: number, lon: number, location?: Location) => void;
  isAnalyzing: boolean;
}) => {
  useMapEvents({
    click: (e) => {
      if (!isAnalyzing) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Component to recenter map
const MapController = ({ center, shouldRecenter }: { center: [number, number]; shouldRecenter: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldRecenter) {
      map.flyTo(center, 8, { duration: 1.5 });
    }
  }, [center, shouldRecenter, map]);
  
  return null;
};

// Risk zone circles for visualization
const RiskZones = ({ location, enabled }: { location: Location | null; enabled: boolean }) => {
  if (!location || !enabled) return null;
  
  const zones = [
    { radius: 50000, color: '#22C55E', opacity: 0.08 },
    { radius: 30000, color: '#F59E0B', opacity: 0.12 },
    { radius: 15000, color: '#EF4444', opacity: 0.16 },
  ];
  
  return (
    <LayerGroup>
      {zones.map((zone, idx) => (
        <Circle
          key={idx}
          center={[location.lat, location.lon]}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            weight: 1,
          }}
        />
      ))}
    </LayerGroup>
  );
};

const MapView = ({ 
  selectedLocation, 
  onLocationSelect, 
  isAnalyzing,
}: MapViewProps) => {
  const { theme } = useTheme();
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'overall', name: 'Risk Zones', enabled: true, type: 'heatmap' },
    { id: 'cities', name: 'Major Cities', enabled: true, type: 'markers' },
    { id: 'satellite', name: 'Satellite View', enabled: false, type: 'zones' },
  ]);
  
  const [mapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const prevLocationRef = useRef<Location | null>(null);
  
  useEffect(() => {
    if (selectedLocation && prevLocationRef.current?.city !== selectedLocation.city) {
      setShouldRecenter(true);
      setTimeout(() => setShouldRecenter(false), 100);
    }
    prevLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, enabled: !l.enabled } : l
    ));
  };

  const showCities = layers.find(l => l.id === 'cities')?.enabled;
  const showSatellite = layers.find(l => l.id === 'satellite')?.enabled;
  const showRiskZones = layers.find(l => l.id === 'overall')?.enabled;

  // Always use OpenStreetMap standard tiles (bright/white) for both modes
  const osmTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Map Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
            <Target className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">India Risk Map</h2>
            {selectedLocation && (
              <p className="text-xs text-muted-foreground">
                {selectedLocation.city}, {selectedLocation.state}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Layer Control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-secondary/50 border-border">
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
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative flex-1">
        <MapContainer
          center={mapCenter}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ background: '#f5f5f5' }}
        >
          {/* Map Tiles - Always use OSM standard (bright) */}
          {showSatellite ? (
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={osmTileUrl}
            />
          )}
          
          {/* Click Handler */}
          <MapClickHandler onLocationSelect={onLocationSelect} isAnalyzing={isAnalyzing} />
          
          {/* Map Controller for recentering */}
          {selectedLocation && (
            <MapController 
              center={[selectedLocation.lat, selectedLocation.lon]} 
              shouldRecenter={shouldRecenter} 
            />
          )}
          
          {/* Risk Zones */}
          <RiskZones location={selectedLocation} enabled={showRiskZones ?? false} />
          
          {/* City Markers - Use unique key with index fallback */}
          {showCities && INDIAN_CITIES.map((city, index) => {
            const isSelected = selectedLocation?.city === city.city;
            const uniqueKey = `${city.city}-${city.state}-${index}`;
            return (
              <Marker
                key={uniqueKey}
                position={[city.lat, city.lon]}
                icon={isSelected ? selectedIcon : cityIcon}
                eventHandlers={{
                  click: () => {
                    if (!isAnalyzing) {
                      onLocationSelect(city.lat, city.lon);
                    }
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="font-semibold text-foreground">{city.city}</div>
                  <div className="text-xs text-muted-foreground">{city.state}</div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Selected Location Marker (if not a predefined city) */}
          {selectedLocation && !INDIAN_CITIES.find(c => c.city === selectedLocation.city) && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lon]}
              icon={selectedIcon}
            >
              <Popup>
                <div className="font-semibold text-foreground">{selectedLocation.city}</div>
                <div className="text-xs text-muted-foreground">{selectedLocation.state}</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {/* Recenter pulse animation shown briefly when map recenters */}
        {shouldRecenter && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-accent/20 animate-ping" />
              <div className="absolute w-6 h-6 rounded-full bg-accent shadow-lg" />
            </div>
          </div>
        )}
        
        {/* Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-accent rounded-full animate-spin" />
                <Navigation className="absolute inset-0 m-auto w-8 h-8 text-accent" />
              </div>
              <p className="text-lg font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Analyzing Location
              </p>
              <p className="text-sm text-muted-foreground mt-1">Running multi-risk evaluation...</p>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-card p-3 text-xs space-y-2 z-10">
          <p className="font-semibold text-foreground">Risk Legend</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-risk-low shadow-sm" />
              <span className="text-muted-foreground">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-risk-medium shadow-sm" />
              <span className="text-muted-foreground">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-risk-high shadow-sm" />
              <span className="text-muted-foreground">High Risk</span>
            </div>
          </div>
        </div>
        
        {/* Coordinates Display */}
        {selectedLocation && (
          <div className="absolute bottom-4 right-4 glass-card px-4 py-2 text-xs font-mono z-10">
            <span className="text-muted-foreground">LAT</span>{' '}
            <span className="text-accent font-semibold">{selectedLocation.lat.toFixed(4)}</span>
            <span className="mx-3 text-border">|</span>
            <span className="text-muted-foreground">LON</span>{' '}
            <span className="text-accent font-semibold">{selectedLocation.lon.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
