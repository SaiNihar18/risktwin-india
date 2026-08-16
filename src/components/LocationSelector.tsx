import { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, 
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { INDIAN_CITIES, findNearestCity } from '@/data/locations';
import type { Location } from '@/types/risk';
import { searchIndiaLocations } from '@/services/geocodingService';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onLocationSelect: (lat: number, lon: number, location?: Location) => void;
  disabled?: boolean;
  className?: string;
}

const LocationSelector = ({ 
  selectedLocation, 
  onLocationSelect,
  disabled = false,
  className
}: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Group cities by state
  const citiesByState = useMemo(() => {
    const grouped: Record<string, typeof INDIAN_CITIES> = {};
    INDIAN_CITIES.forEach(city => {
      if (!grouped[city.state]) {
        grouped[city.state] = [];
      }
      grouped[city.state].push(city);
    });
    return grouped;
  }, []);

  const handleSelect = (city: typeof INDIAN_CITIES[0]) => {
    onLocationSelect(city.lat, city.lon, city);
    setSearchQuery('');
    setRemoteResults([]);
    setOpen(false);
  };

  const handleSelectLocation = (location: Location) => {
    onLocationSelect(location.lat, location.lon, location);
    setSearchQuery('');
    setRemoteResults([]);
    setOpen(false);
  };

  const handleUseNearestSupportedArea = (location: Location) => {
    const nearest = findNearestCity(location.lat, location.lon);
    onLocationSelect(location.lat, location.lon, {
      ...nearest,
      district: location.district,
    });
    setSearchQuery('');
    setRemoteResults([]);
    setOpen(false);
  };

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      const results = await searchIndiaLocations(searchQuery);
      if (!cancelled) {
        setRemoteResults(results);
        setIsSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const filteredLocalByState = Object.entries(citiesByState)
    .map(([state, cities]) => ({
      state,
      cities: cities.filter(city =>
        city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(({ cities }) => cities.length > 0);

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Select Location</h2>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {['New Delhi','Mumbai','Bangalore','Chennai','Kolkata'].map((c) => {
          const city = INDIAN_CITIES.find(x => x.city === c);
          if (!city) return null;
          return (
            <Button
              key={c}
              variant={selectedLocation?.city === city.city ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSelect(city)}
              className="px-3 py-1"
              disabled={disabled}
            >
              {city.city}
            </Button>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent border border-border/10 hover:bg-secondary/30 px-4 py-3 rounded-lg text-left"
            disabled={disabled}
          >
            {selectedLocation ? (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">{selectedLocation.city}</div>
                  <div className="text-xs text-muted-foreground">{selectedLocation.state}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Search city or state (e.g. New Delhi)</div>
            )}
            <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[420px] p-0" align="start">
          <Command>
            <div className="p-3">
              <CommandInput 
                placeholder="Type any place in India (city, town, area)..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="text-lg"
              />
            </div>
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>

              {isSearching && (
                <CommandGroup heading="Live Search">
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching OpenStreetMap locations...
                  </div>
                </CommandGroup>
              )}

              {remoteResults.length > 0 && (
                <CommandGroup heading="Live Search Results">
                  {remoteResults.map((location, idx) => {
                    const nearest = findNearestCity(location.lat, location.lon);
                    const isExactSupported = nearest.city === location.city && nearest.state === location.state;
                    return (
                      <CommandItem
                        key={`${location.city}-${location.state}-${idx}`}
                        value={`${location.city} ${location.state} ${location.district || ''}`}
                        onSelect={() => handleSelectLocation(location)}
                        className="cursor-pointer"
                      >
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                          <span>{location.city}</span>
                          <span className="text-xs text-muted-foreground">{location.state}</span>
                        </div>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {isExactSupported ? 'Direct area' : `Nearest supported: ${nearest.city}`}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {remoteResults.length > 0 && (
                <CommandGroup heading="Nearest Supported Area">
                  {remoteResults.map((location, idx) => {
                    const nearest = findNearestCity(location.lat, location.lon);
                    return (
                      <CommandItem
                        key={`nearest-${location.city}-${idx}`}
                        value={`nearest ${nearest.city} ${nearest.state}`}
                        onSelect={() => handleUseNearestSupportedArea(location)}
                        className="cursor-pointer"
                      >
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        Use nearest supported area: {nearest.city}, {nearest.state}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {filteredLocalByState.map(({ state, cities }) => (
                <CommandGroup key={state} heading={state}>
                  {cities.map(city => (
                      <CommandItem
                        key={city.city}
                        value={`${city.city} ${state}`}
                        onSelect={() => handleSelect(city)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedLocation?.city === city.city
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {city.city}
                        <span className="ml-auto text-xs text-muted-foreground">{state}</span>
                      </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedLocation && (
        <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Latitude:</span>
              <span className="ml-2 font-mono text-primary">
                {selectedLocation.lat.toFixed(4)}°
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude:</span>
              <span className="ml-2 font-mono text-primary">
                {selectedLocation.lon.toFixed(4)}°
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
