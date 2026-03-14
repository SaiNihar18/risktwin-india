import type { LiveConditions } from '@/types/risk';
import { getWindCompass } from '@/data/mockData';

interface OpenMeteoCurrentWeatherResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    precipitation?: number;
    precipitation_probability?: number;
    time?: string;
  };
}

interface OpenMeteoCurrentAirResponse {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
  };
}

interface OpenMeteoHistoryWeatherResponse {
  daily?: {
    time?: string[];
    temperature_2m_mean?: number[];
  };
}

interface OpenMeteoHistoryAirResponse {
  daily?: {
    time?: string[];
    us_aqi_max?: number[];
  };
}

interface HistoryPoint {
  date: string;
  temp: number;
  aqi: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export const fetchLiveConditions = async (lat: number, lon: number): Promise<LiveConditions | null> => {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`;

  const [weatherResp, airResp] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);

  if (!weatherResp.ok) {
    throw new Error(`Open-Meteo weather request failed: ${weatherResp.status}`);
  }
  if (!airResp.ok) {
    throw new Error(`Open-Meteo air quality request failed: ${airResp.status}`);
  }

  const weatherData: OpenMeteoCurrentWeatherResponse = await weatherResp.json();
  const airData: OpenMeteoCurrentAirResponse = await airResp.json();

  const temperature = weatherData.current?.temperature_2m;
  const humidity = weatherData.current?.relative_humidity_2m;
  const windSpeed = weatherData.current?.wind_speed_10m;
  const windDirection = weatherData.current?.wind_direction_10m;
  const rainfall = weatherData.current?.precipitation ?? 0;
  const rainProbability = weatherData.current?.precipitation_probability ?? 0;
  const aqi = airData.current?.us_aqi;
  const pm25 = airData.current?.pm2_5;

  if (
    temperature === undefined ||
    humidity === undefined ||
    windSpeed === undefined ||
    windDirection === undefined ||
    aqi === undefined ||
    pm25 === undefined
  ) {
    throw new Error('Incomplete live weather/air payload from Open-Meteo');
  }

  return {
    temperature: round1(temperature),
    humidity: round1(humidity),
    windSpeed: round1(windSpeed),
    windDirection: round1(windDirection),
    windCompass: getWindCompass(windDirection),
    rainfall: round1(rainfall),
    rainProbability: Math.round(rainProbability),
    aqi: Math.round(aqi),
    pm25: round1(pm25),
    lastUpdated: new Date(),
  };
};

export const fetchHistoricalTrend = async (lat: number, lon: number, days = 5): Promise<HistoryPoint[]> => {
  const safeDays = Math.max(2, Math.min(10, days));
  const weatherHistoryUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean&past_days=${safeDays}&timezone=auto`;
  const airHistoryUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&daily=us_aqi_max&past_days=${safeDays}&timezone=auto`;

  const [weatherResp, airResp] = await Promise.all([fetch(weatherHistoryUrl), fetch(airHistoryUrl)]);

  if (!weatherResp.ok || !airResp.ok) {
    return [];
  }

  const weatherData: OpenMeteoHistoryWeatherResponse = await weatherResp.json();
  const airData: OpenMeteoHistoryAirResponse = await airResp.json();

  const dates = weatherData.daily?.time ?? [];
  const temps = weatherData.daily?.temperature_2m_mean ?? [];
  const aqiByDate = new Map<string, number>();

  (airData.daily?.time ?? []).forEach((date, idx) => {
    const value = airData.daily?.us_aqi_max?.[idx];
    if (value !== undefined) {
      aqiByDate.set(date, Math.round(value));
    }
  });

  return dates
    .map((date, idx) => {
      const temp = temps[idx];
      if (temp === undefined) {
        return null;
      }

      return {
        date,
        temp: round1(temp),
        aqi: aqiByDate.get(date) ?? 0,
      };
    })
    .filter((row): row is HistoryPoint => row !== null);
};
