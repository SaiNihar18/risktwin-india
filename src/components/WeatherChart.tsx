import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DataPoint {
  date: string;
  temp: number;
  aqi: number;
}

const formatDay = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

const WeatherChart = ({ data }: { data: DataPoint[] }) => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">5-Day Summary</h3>
        <span className="text-xs text-muted-foreground">Temperature & AQI</span>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={formatDay} />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="temp" stroke="#3B82F6" fillOpacity={1} fill="url(#tempGrad)" name="Temp (°C)" />
            <Area yAxisId="right" type="monotone" dataKey="aqi" stroke="#F59E0B" fillOpacity={0.6} fill="url(#aqiGrad)" name="AQI" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherChart;
