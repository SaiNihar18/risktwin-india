import type { LiveConditions } from '@/types/risk';
import { getWindCompass } from '@/data/mockData';

// OpenWeatherMap free tier API
const OPENWEATHER_API_KEY = '5d066958a60d315387d9492393935c19'; // Free demo key
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// AQICN (World Air Quality Index) - free token
const AQICN_TOKEN = 'demo'; // Use 'demo' for testing, get real token from aqicn.org
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
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      o3?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
    };
    city: {
      name: string;
    };
  };
}

// Fetch weather data from OpenWeatherMap
export const fetchWeatherData = async (lat: number, lon: number): Promise<Partial<LiveConditions>> => {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data: OpenWeatherResponse = await response.json();
    
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
    console.warn('Weather API failed, using fallback:', error);
    return {};
  }
};

// Fetch AQI data from AQICN
export const fetchAQIData = async (lat: number, lon: number): Promise<{ aqi: number; pm25: number }> => {
  try {
    const response = await fetch(
      `${AQICN_BASE_URL}/feed/geo:${lat};${lon}/?token=${AQICN_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error('AQI API request failed');
    }
    
    const data: AQICNResponse = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error('AQI data not available');
    }
    
    return {
      aqi: data.data.aqi || 50,
      pm25: data.data.iaqi?.pm25?.v || Math.round(data.data.aqi * 0.5),
    };
  } catch (error) {
    console.warn('AQI API failed, using fallback:', error);
    return { aqi: 0, pm25: 0 };
  }
};

// Combined function to fetch all live data
export const fetchLiveConditions = async (lat: number, lon: number): Promise<LiveConditions | null> => {
  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(lat, lon),
      fetchAQIData(lat, lon),
    ]);
    
    // If we got weather data, combine with AQI
    if (weatherData.temperature !== undefined) {
      return {
        temperature: weatherData.temperature || 25,
        humidity: weatherData.humidity || 50,
        windSpeed: weatherData.windSpeed || 10,
        windDirection: weatherData.windDirection || 0,
        windCompass: weatherData.windCompass || 'N',
        rainfall: weatherData.rainfall || 0,
        rainProbability: weatherData.rainProbability || 0,
        aqi: aqiData.aqi || 50,
        pm25: aqiData.pm25 || 25,
        lastUpdated: new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch live conditions:', error);
    return null;
  }
};
