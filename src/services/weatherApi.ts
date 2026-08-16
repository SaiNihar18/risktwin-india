import type { LiveConditions } from '@/types/risk';
import { getWindCompass } from '@/services/riskAnalysis';

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

// Indian National Air Quality Index (NAQI - CPCB / EPA standard) calculator
export const calculateIndianAQI = (pm25?: number, pm10?: number): number => {
  const getSubIndex = (val: number, breakpoints: [number, number, number, number][]) => {
    for (const [clo, chi, ilo, ihi] of breakpoints) {
      if (val >= clo && val <= chi) {
        return Math.round(((ihi - ilo) / (chi - clo)) * (val - clo) + ilo);
      }
    }
    if (val > 500) return 500;
    return Math.round(val * 1.67);
  };

  const pm25Breakpoints: [number, number, number, number][] = [
    [0, 30, 0, 50],
    [30.1, 60, 51, 100],
    [60.1, 90, 101, 200],
    [90.1, 120, 201, 300],
    [120.1, 250, 301, 400],
    [250.1, 500, 401, 500],
  ];

  const pm10Breakpoints: [number, number, number, number][] = [
    [0, 50, 0, 50],
    [50.1, 100, 51, 100],
    [100.1, 250, 101, 200],
    [250.1, 350, 201, 300],
    [350.1, 430, 301, 400],
    [430.1, 500, 401, 500],
  ];

  const sub25 = pm25 !== undefined ? getSubIndex(pm25, pm25Breakpoints) : 0;
  const sub10 = pm10 !== undefined ? getSubIndex(pm10, pm10Breakpoints) : 0;
  return Math.max(sub25, sub10, 15);
};

// Fetch AQI and PM2.5 data from OpenWeatherMap Air Pollution API
export const fetchAirPollution = async (lat: number, lon: number): Promise<{ aqi: number; pm25: number }> => {
  try {
    console.log('[AirPollution] Fetching data for:', lat, lon);

    const resp = await fetch(`${OPENWEATHER_AIR_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    if (!resp.ok) {
      console.warn('[AirPollution] Response not OK:', resp.status);
      throw new Error(`Air pollution API failed: ${resp.status}`);
    }

    const data = await resp.json();
    const components = data?.list?.[0]?.components;
    const pm25 = Math.round((components?.pm2_5 ?? 25) * 10) / 10;
    const pm10 = components?.pm10;
    const computedAqi = calculateIndianAQI(pm25, pm10);

    return { aqi: computedAqi, pm25 };
  } catch (error) {
    console.error('[AirPollution] Failed:', error);
    return { aqi: 85, pm25: 45 };
  }
};

interface ForecastListItem {
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{ main: string; description: string }>;
}

// Fetch 5-day / 3-hour forecast from OpenWeatherMap
export const fetchForecastData = async (lat: number, lon: number): Promise<Array<{ date: string; temp: number; aqi: number }>> => {
  try {
    console.log('[Forecast API] Fetching 5-day forecast for:', lat, lon);
    const resp = await fetch(`${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    if (!resp.ok) {
      console.warn('[Forecast API] Response not OK:', resp.status);
      return [];
    }

    const data = await resp.json();
    const list: ForecastListItem[] = data?.list || [];
    
    // Aggregate by unique calendar days (1 entry per day, midday ~12:00 or closest)
    const dailyMap = new Map<string, { date: string; temp: number; aqi: number }>();
    
    for (const item of list) {
      const dateKey = item.dt_txt.split(' ')[0]; // YYYY-MM-DD
      const isMidday = item.dt_txt.includes('12:00:00') || !dailyMap.has(dateKey);
      
      if (isMidday || !dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: item.dt_txt,
          temp: Math.round(item.main.temp * 10) / 10,
          aqi: Math.round(50 + (item.main.humidity > 70 ? 30 : 10)), // Correlated baseline
        });
      }
    }

    return Array.from(dailyMap.values()).slice(0, 5);
  } catch (error) {
    console.warn('[Forecast API] Failed to fetch forecast:', error);
    return [];
  }
};

interface FwiForecastItem {
  main?: { fwi?: number };
  danger_rating?: { description?: string };
}

// Fetch FWI (fire weather index) forecast
export const fetchFWIForecast = async (lat: number, lon: number): Promise<{ fwi?: number; danger?: string }[]> => {
  try {
    console.log('[FWI] Fetching FWI forecast for:', lat, lon);
    const resp = await fetch(`${OPENWEATHER_FWI_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    
    if (resp.status === 401 || resp.status === 403) {
      console.info('[FWI] Endpoint unauthorized (401/403). Standard free key does not support FWI. Falling back to local CBI calculation.');
      return [];
    }

    if (!resp.ok) {
      console.warn('[FWI] Response not OK:', resp.status);
      throw new Error(`FWI API failed: ${resp.status}`);
    }

    const data = await resp.json();
    const forecast = (data?.list || []).map((it: FwiForecastItem) => ({
      fwi: it?.main?.fwi,
      danger: it?.danger_rating?.description || undefined,
    }));

    return forecast;
  } catch (error: unknown) {
    const err = error as Error;
    console.warn('[FWI] Failed (using fallback):', err.message);
    return [];
  }
};

import { getActiveFiresForLocation } from '@/services/firmsApi';

// Combined function to fetch all live data
export const fetchLiveConditions = async (lat: number, lon: number): Promise<LiveConditions | null> => {
  console.log('[Live Data] Fetching conditions for:', lat.toFixed(4), lon.toFixed(4));
  const [weatherData, aqiData, fwiForecast, forecastData, fireSummary] = await Promise.all([
    fetchWeatherData(lat, lon),
    fetchAirPollution(lat, lon),
    fetchFWIForecast(lat, lon),
    fetchForecastData(lat, lon),
    getActiveFiresForLocation(lat, lon, 250),
  ]);

  // If we got weather data, combine with AQI and satellite fire observations
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
      forecast: forecastData.length > 0 ? forecastData : undefined,
      // NASA FIRMS Live Telemetry
      activeFiresNearby: fireSummary.hotspotsNearby,
      closestFireDistance: fireSummary.closestDistanceKm ?? undefined,
      maxFirePower: fireSummary.maxFrp,
      activeFiresList: fireSummary.nearbyFires,
    };

    console.log('[Live Data] Combined result:', {
      temp: conditions.temperature,
      humidity: conditions.humidity,
      aqi: conditions.aqi,
      forecastCount: forecastData.length,
      activeFiresNearby: fireSummary.hotspotsNearby,
    });

    return conditions;
  }

  console.warn('[Live Data] No weather data received');
  return null;
};
