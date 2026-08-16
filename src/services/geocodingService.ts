import type { Location } from '@/types/risk';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    state_district?: string;
    county?: string;
  };
}

const countryCode = 'in';

const pickCity = (item: NominatimResult) => {
  const address = item.address;
  return address?.city || address?.town || address?.village || item.display_name.split(',')[0].trim();
};

const pickState = (item: NominatimResult) => {
  const address = item.address;
  return address?.state || address?.state_district || address?.county || 'Unknown';
};

export const searchIndiaLocations = async (query: string): Promise<Location[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=${countryCode}&limit=6&q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data: NominatimResult[] = await response.json();

  return data
    .map((item): Location | null => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return null;
      }

      return {
        lat,
        lon,
        city: pickCity(item),
        state: pickState(item),
        district: item.address?.state_district || item.address?.county,
      };
    })
    .filter((item): item is Location => item !== null);
};
