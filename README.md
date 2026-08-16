# RiskTwin India

RiskTwin India is a React + TypeScript web application for live multi-risk situational awareness.

The app analyzes a selected location using real-time public feeds for weather, air quality, and disaster alerts. It does not use synthetic test/mock fallback data in runtime analysis.

## Live Data Sources

- Open-Meteo Forecast API (no key): current weather signals
- Open-Meteo Air Quality API (no key): AQI and PM2.5
- GDACS API (no key): disaster alerts (flood, cyclone, earthquake, wildfire where available)
- USGS Earthquake API (no key): regional seismic activity
- OpenStreetMap Nominatim (optional): reverse geocoding fallback metadata

## Current Scope

- Live weather and AQI scoring is active.
- Hazard scoring uses GDACS and USGS.
- Crime risk is dataset-based via NCRB CSV (no synthetic fallback).
- Safe-place recommendations are generated from nearest supported areas.

## Location Selection Behavior

- Users can search any place in India using OpenStreetMap Nominatim live search.
- If an exact supported area is not available in the internal city grid, the app can resolve to the nearest supported area automatically.
- Map clicks are supported anywhere; analysis uses selected coordinates and nearest supported metadata where required.

## Tech Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Leaflet + React-Leaflet
- Vitest

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install and Run

```bash
npm install
npm run dev
```

App runs at the local Vite URL shown in terminal (usually http://localhost:5173).

## Scripts

```bash
npm run dev        # start development server
npm run build      # production build
npm run preview    # preview production build
npm run lint       # run eslint
npm run test       # run vitest once
npm run test:watch # run vitest in watch mode
```

## Architecture Notes

- Location selection supports both predefined Indian cities and live OSM place search.
- Runtime risk outputs are deterministic from live API payloads.
- If required feeds are unavailable, the UI shows a live-data error state instead of demo values.
- Historical chart values are fetched from Open-Meteo historical endpoints.

## NCRB Crime Dataset Integration

The app reads state/district crime data from:

- public/data/ncrb_state_crime_rates.csv

Required CSV columns:

- state
- district
- year
- crime_rate_per_100k

Notes:

- Keep official NCRB-derived values only.
- Do not add synthetic rows.
- If a state is missing from CSV, crime risk remains unavailable for that location.

## Planned Integrations

1. NCRB district-wise crime dataset mapping (data.gov.in) and optional yearly refresh job.
2. FEMA/INFORM/NDMA overlays for additional hazard context.
3. Server-side proxy/cache for rate-limit protection and feed normalization.

## Compliance and Attribution

- OpenStreetMap data: attribution to OpenStreetMap contributors where applicable.
- All API usage should respect provider terms and rate limits.

## Deployment

Build and deploy static assets:

```bash
npm run build
```

Then host the generated dist/ directory on your static hosting platform.

### Deploy on Vercel

This repository now includes vercel.json for Vite + SPA routing.

1. Import the repository in Vercel.
2. Build command: npm run build
3. Output directory: dist
4. Deploy.

The rewrite rule routes all paths to index.html so React Router works on refresh and deep links.
