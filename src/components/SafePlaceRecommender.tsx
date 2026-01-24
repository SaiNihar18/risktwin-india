import { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Star, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SafePlace, Location } from '@/types/risk';

interface SafePlaceRecommenderProps {
  safePlaces: SafePlace[] | null;
  currentLocation: Location | null;
  onPlaceSelect?: (place: SafePlace) => void;
  isLoading?: boolean;
}

const SafePlaceCard = ({ 
  place, 
  rank, 
  onSelect 
}: { 
  place: SafePlace; 
  rank: number;
  onSelect?: () => void;
}) => {
  const isTopPick = rank === 1;
  
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-4 border transition-all duration-300
        hover:border-primary/50 hover:shadow-glow-cyan cursor-pointer group
        ${isTopPick 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
          : 'bg-secondary/30 border-border/30'
        }
      `}
      onClick={onSelect}
    >
      {/* Top Pick Badge */}
      {isTopPick && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg flex items-center gap-1">
            <Star className="w-3 h-3" />
            Recommended
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold
          ${isTopPick 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-muted-foreground'
          }
        `}>
          #{rank}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{place.city}</h3>
            <span className="text-xs text-muted-foreground">{place.state}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>{place.distance} km</span>
            </div>
            <div className="flex items-center gap-1 text-risk-low">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">{Math.round(place.safeScore * 100)}% Safe</span>
            </div>
          </div>

          {/* Reasons */}
          <div className="flex flex-wrap gap-1.5">
            {place.reasons.map((reason, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-secondary/50"
              >
                {reason}
              </Badge>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Risk Reduction Indicator */}
      {place.riskReduction > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs">
            <ArrowRight className="w-3.5 h-3.5 text-risk-low" />
            <span className="text-muted-foreground">Moving here could reduce risk by</span>
            <span className="text-risk-low font-semibold">{place.riskReduction}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-xl p-4 border border-border/30 bg-secondary/20 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-secondary rounded-full" />
      <div className="flex-1">
        <div className="w-32 h-5 bg-secondary rounded mb-2" />
        <div className="flex gap-3 mb-3">
          <div className="w-16 h-4 bg-secondary rounded" />
          <div className="w-20 h-4 bg-secondary rounded" />
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-5 bg-secondary rounded-full" />
          <div className="w-24 h-5 bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const SafePlaceRecommender = ({ 
  safePlaces, 
  currentLocation,
  onPlaceSelect,
  isLoading = false 
}: SafePlaceRecommenderProps) => {
  const [distanceFilter, setDistanceFilter] = useState<50 | 100 | 200 | 500>(200);
  const [showAll, setShowAll] = useState(false);

  if (!currentLocation) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Find Safer Places</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a location to find safer alternatives nearby</p>
        </div>
      </div>
    );
  }

  const filteredPlaces = safePlaces?.filter(p => p.distance <= distanceFilter) || [];
  const displayPlaces = showAll ? filteredPlaces : filteredPlaces.slice(0, 3);

  return (
    <div className="glass-card p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Safer Places Near You</h2>
        </div>

        {/* Distance Filter */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          {([50, 100, 200, 500] as const).map(dist => (
            <button
              key={dist}
              onClick={() => setDistanceFilter(dist)}
              className={`
                px-2 py-1 text-xs rounded-md transition-colors
                ${distanceFilter === dist 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {dist}km
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPlaces.length > 0 ? (
        <>
          <div className="space-y-3">
            {displayPlaces.map((place, idx) => (
              <SafePlaceCard 
                key={place.city} 
                place={place} 
                rank={idx + 1}
                onSelect={() => onPlaceSelect?.(place)}
              />
            ))}
          </div>

          {filteredPlaces.length > 3 && !showAll && (
            <Button
              variant="ghost"
              className="w-full mt-3"
              onClick={() => setShowAll(true)}
            >
              Show {filteredPlaces.length - 3} more places
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No safer places found within {distanceFilter}km</p>
          <p className="text-xs mt-1">Try increasing the distance filter</p>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">AI-Assisted Recommendations:</span> Places are ranked by 
          overall safety score combining AQI, climate comfort, crime rates, and disaster susceptibility.
          This is advisory information, not relocation advice.
        </p>
      </div>
    </div>
  );
};

export default SafePlaceRecommender;
