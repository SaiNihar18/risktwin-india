import type { LiveConditions } from '@/types/risk';
import { getWindCompass } from '@/data/mockData';

// OpenWeatherMap free tier API (free key - 1000 calls/day)
const OPENWEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// We'll use OpenWeatherMap's Air Pollution API for AQI (same account key)
const OPENWEATHER_AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// FWI (Fire Weather Index) forecast endpoint (OpenWeather has an FWI forecast)
const OPENWEATHER_FWI_URL = 'https://api.openweathermap.org/data/2.5/fwi/forecast';

interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  clouds: {
    all: number;
  };
  name: string;
}

interface AQICNResponse {
  status: string;
  data: {
    aqi: number;
    iaqi?: {
      pm25?: { v: number };
      pm10?: { v: number };
      o3?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
    };
    city?: {
      name: string;
    };
  };
}

// Fetch weather data from OpenWeatherMap
export const fetchWeatherData = async (lat: number, lon: number): Promise<Partial<LiveConditions>> => {
  try {
    console.log('[Weather API] Fetching data for:', lat, lon);
    
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      console.warn('[Weather API] Response not OK:', response.status);
      throw new Error(`Weather API request failed: ${response.status}`);
    }
    
    const data: OpenWeatherResponse = await response.json();
    console.log('[Weather API] Success:', data.name, data.main.temp + '°C');
    
    const windDirection = data.wind?.deg || 0;
    const rainfall = data.rain?.['1h'] || data.rain?.['3h'] || 0;
    
    // Estimate rain probability based on weather conditions and clouds
    const weatherMain = data.weather?.[0]?.main?.toLowerCase() || '';
    let rainProbability = data.clouds?.all || 0;
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
      rainProbability = Math.max(rainProbability, 70);
    } else if (weatherMain.includes('cloud')) {
      rainProbability = Math.min(rainProbability, 50);
    }
    
    return {
      temperature: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // Convert m/s to km/h
      windDirection,
      windCompass: getWindCompass(windDirection),
      rainfall: Math.round(rainfall * 10) / 10,
      rainProbability: Math.round(rainProbability),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('[Weather API] Failed:', error);
    return {};
  }
};

// Fetch AQI data from AQICN
// Fetch air pollution from OpenWeatherMap (air_pollution)
export const fetchAirPollution = async (lat: number, lon: number): Promise<{ aqi: number; pm25: number }> => {
  try {
    console.log('[AirPollution] Fetching data for:', lat, lon);

    const resp = await fetch(`${OPENWEATHER_AIR_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    if (!resp.ok) {
      console.warn('[AirPollution] Response not OK:', resp.status);
      throw new Error(`Air pollution API failed: ${resp.status}`);
    }

    const data = await resp.json();
    // Expected structure: { coord: [...], list: [ { main: { aqi }, components: { pm2_5 } } ] }
    const aqi = data?.list?.[0]?.main?.aqi ?? 2;
    const pm25 = data?.list?.[0]?.components?.pm2_5 ?? Math.round((aqi || 2) * 12);

    return { aqi, pm25 };
  } catch (error) {
    console.error('[AirPollution] Failed:', error);
    return { aqi: 85, pm25: 45 };
  }
};

// Fetch FWI (fire weather index) forecast
export const fetchFWIForecast = async (lat: number, lon: number): Promise<{ fwi?: number; danger?: string }[]> => {
  try {
    console.log('[FWI] Fetching FWI forecast for:', lat, lon);
    const resp = await fetch(`${OPENWEATHER_FWI_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    if (!resp.ok) {
      console.warn('[FWI] Response not OK:', resp.status);
      throw new Error(`FWI API failed: ${resp.status}`);
    }

    const data = await resp.json();
    // Expect 'list' array with 'main.fwi' and optional danger_rating
    const forecast = (data?.list || []).map((it: any) => ({
      fwi: it?.main?.fwi,
      danger: it?.danger_rating?.description || undefined,
    }));

    return forecast;
  } catch (error) {
    console.error('[FWI] Failed:', error);
    return [];
  }
};

// Combined function to fetch all live data
export const fetchLiveConditions = async (lat: number, lon: number): Promise<LiveConditions | null> => {
  console.log('[Live Data] Fetching conditions for:', lat.toFixed(4), lon.toFixed(4));
  const [weatherData, aqiData, fwiForecast] = await Promise.all([
    fetchWeatherData(lat, lon),
    fetchAirPollution(lat, lon),
    fetchFWIForecast(lat, lon),
  ]);

  // If we got weather data, combine with AQI
  if (weatherData.temperature !== undefined) {
    const conditions: LiveConditions = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity || 50,
      windSpeed: weatherData.windSpeed || 10,
      windDirection: weatherData.windDirection || 0,
      windCompass: weatherData.windCompass || 'N',
      rainfall: weatherData.rainfall || 0,
      rainProbability: weatherData.rainProbability || 0,
      aqi: aqiData.aqi,
      pm25: aqiData.pm25,
      lastUpdated: new Date(),
      // Use the first available FWI forecast entry as an indicator
      wildfireFwi: fwiForecast?.[0]?.fwi,
      wildfireDanger: fwiForecast?.[0]?.danger,
    };

    console.log('[Live Data] Combined result:', {
      temp: conditions.temperature,
      humidity: conditions.humidity,
      aqi: conditions.aqi,
    });

    return conditions;
  }

  console.warn('[Live Data] No weather data received');
  // If upstream APIs returned non-ok they will have thrown - let the caller handle it
  return null;
};
