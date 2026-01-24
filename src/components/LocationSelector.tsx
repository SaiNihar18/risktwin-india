import { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { INDIAN_CITIES } from '@/data/mockData';
import type { Location } from '@/types/risk';

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onLocationSelect: (lat: number, lon: number) => void;
  disabled?: boolean;
}

const LocationSelector = ({ 
  selectedLocation, 
  onLocationSelect,
  disabled = false
}: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    onLocationSelect(city.lat, city.lon);
    setOpen(false);
  };

  return (
    <div className="glass-card p-4">
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
              variant={selectedLocation?.city === city.city ? 'solid' : 'ghost'}
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
                placeholder="Type to search cities or states..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="text-lg"
              />
            </div>
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              {Object.entries(citiesByState).map(([state, cities]) => (
                <CommandGroup key={state} heading={state}>
                  {cities
                    .filter(city => 
                      city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      state.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(city => (
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
