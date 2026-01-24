import type { LiveConditions } from '@/types/risk';
import { getWindCompass } from '@/data/mockData';

// OpenWeatherMap free tier API (free key - 1000 calls/day)
const OPENWEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// AQICN (World Air Quality Index) - public token
const AQICN_TOKEN = 'demo';
const AQICN_BASE_URL = 'https://api.waqi.info';

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
export const fetchAQIData = async (lat: number, lon: number): Promise<{ aqi: number; pm25: number }> => {
  try {
    console.log('[AQI API] Fetching data for:', lat, lon);
    
    const response = await fetch(
      `${AQICN_BASE_URL}/feed/geo:${lat};${lon}/?token=${AQICN_TOKEN}`
    );
    
    if (!response.ok) {
      console.warn('[AQI API] Response not OK:', response.status);
      throw new Error(`AQI API request failed: ${response.status}`);
    }
    
    const data: AQICNResponse = await response.json();
    
    if (data.status !== 'ok' || !data.data) {
      console.warn('[AQI API] Data status not OK or missing data');
      // Return reasonable defaults for Indian cities
      return { aqi: 85, pm25: 45 };
    }
    
    console.log('[AQI API] Success:', data.data.aqi);
    
    return {
      aqi: typeof data.data.aqi === 'number' ? data.data.aqi : 85,
      pm25: data.data.iaqi?.pm25?.v || Math.round((data.data.aqi || 85) * 0.5),
    };
  } catch (error) {
    console.error('[AQI API] Failed:', error);
    // Return reasonable defaults instead of zeros
    return { aqi: 85, pm25: 45 };
  }
};

// Combined function to fetch all live data
export const fetchLiveConditions = async (lat: number, lon: number): Promise<LiveConditions | null> => {
  console.log('[Live Data] Fetching conditions for:', lat.toFixed(4), lon.toFixed(4));
  
  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(lat, lon),
      fetchAQIData(lat, lon),
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
      };
      
      console.log('[Live Data] Combined result:', {
        temp: conditions.temperature,
        humidity: conditions.humidity,
        aqi: conditions.aqi,
      });
      
      return conditions;
    }
    
    console.warn('[Live Data] No weather data received');
    return null;
  } catch (error) {
    console.error('[Live Data] Failed to fetch conditions:', error);
    return null;
  }
};
