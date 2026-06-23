/**
 * Weather data via Open-Meteo (no API key required). Includes WMO weather-code
 * → human label + icon mapping so widgets stay declarative.
 */

export interface WeatherNow {
  temp: number;
  code: number;
  isDay: boolean;
  label: string;
  icon: string;
}
export interface HourPoint {
  time: string;
  temp: number;
  code: number;
}
export interface DayPoint {
  date: string;
  min: number;
  max: number;
  code: number;
}
export interface WeatherData {
  now: WeatherNow;
  hourly: HourPoint[];
  daily: DayPoint[];
  unit: string;
}

/** Cupertino — last-resort fallback when no location source is reachable. */
export const FALLBACK_COORDS = { lat: 37.323, lon: -122.0322, label: 'Cupertino' };

export interface ResolvedLocation {
  lat: number;
  lon: number;
  /** Human-readable place (city) when known, so the user can verify it. */
  place: string | null;
  /** How the location was determined. */
  source: 'gps' | 'ip' | 'fallback' | 'manual';
}

const CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear', icon: 'sun' },
  1: { label: 'Mostly Clear', icon: 'sun' },
  2: { label: 'Partly Cloudy', icon: 'cloud' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'cloud' },
  48: { label: 'Rime Fog', icon: 'cloud' },
  51: { label: 'Light Drizzle', icon: 'cloudrain' },
  53: { label: 'Drizzle', icon: 'cloudrain' },
  55: { label: 'Heavy Drizzle', icon: 'cloudrain' },
  61: { label: 'Light Rain', icon: 'cloudrain' },
  63: { label: 'Rain', icon: 'cloudrain' },
  65: { label: 'Heavy Rain', icon: 'cloudrain' },
  71: { label: 'Light Snow', icon: 'cloud' },
  73: { label: 'Snow', icon: 'cloud' },
  75: { label: 'Heavy Snow', icon: 'cloud' },
  80: { label: 'Showers', icon: 'cloudrain' },
  81: { label: 'Showers', icon: 'cloudrain' },
  82: { label: 'Violent Showers', icon: 'cloudrain' },
  95: { label: 'Thunderstorm', icon: 'cloudrain' },
  96: { label: 'Thunderstorm', icon: 'cloudrain' },
  99: { label: 'Thunderstorm', icon: 'cloudrain' }
};

export function describeCode(code: number): { label: string; icon: string } {
  return CODE_MAP[code] ?? { label: 'Unknown', icon: 'cloud' };
}

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Precise device location — only resolves if the user has granted permission. */
function browserGeolocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 600_000 }
    );
  });
}

/** Turn precise coordinates into a city name (keyless, CORS-enabled). */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const d = await res.json();
    return d.city || d.locality || d.principalSubdivision || null;
  } catch {
    return null;
  }
}

/** Coarse, permission-free location from the visitor's IP (keyless, CORS). */
async function ipLocation(): Promise<ResolvedLocation | null> {
  try {
    const res = await fetchWithTimeout('https://ipwho.is/');
    if (!res.ok) return null;
    const d = await res.json();
    if (d && d.success !== false && typeof d.latitude === 'number' && typeof d.longitude === 'number') {
      return { lat: d.latitude, lon: d.longitude, place: d.city || d.region || null, source: 'ip' };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve the user's location for weather. Prefers precise device geolocation
 * (with permission); if that's denied or unavailable — common on a new-tab
 * page — falls back to permission-free IP-based location so the widget still
 * shows the user's actual city, and only then to a hardcoded default.
 */
export async function getLocation(): Promise<ResolvedLocation> {
  const precise = await browserGeolocation();
  if (precise) {
    const place = await reverseGeocode(precise.lat, precise.lon);
    return { ...precise, place, source: 'gps' };
  }

  const ip = await ipLocation();
  if (ip) return ip;

  return { lat: FALLBACK_COORDS.lat, lon: FALLBACK_COORDS.lon, place: FALLBACK_COORDS.label, source: 'fallback' };
}

/** Look up a city the user typed → coordinates (Open-Meteo geocoding, keyless). */
export async function geocodeCity(query: string): Promise<ResolvedLocation | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`
    );
    if (!res.ok) return null;
    const d = await res.json();
    const r = d.results?.[0];
    if (!r) return null;
    const place = [r.name, r.admin1, r.country_code].filter(Boolean).slice(0, 2).join(', ');
    return { lat: r.latitude, lon: r.longitude, place: place || r.name, source: 'manual' };
  } catch {
    return null;
  }
}

/** Map a National Weather Service text description to our icon set. */
function iconForText(text: string, isDay = true): string {
  const s = text.toLowerCase();
  if (/thunder|t-?storm/.test(s)) return 'cloudrain';
  if (/rain|shower|drizzle/.test(s)) return 'cloudrain';
  if (/snow|sleet|ice|flurr|wintry/.test(s)) return 'cloud';
  if (/fog|haze|mist|smoke/.test(s)) return 'cloud';
  if (/cloud|overcast/.test(s)) return 'cloud';
  if (/clear|sunny|fair/.test(s)) return isDay ? 'sun' : 'moon';
  return 'cloud';
}

export interface CurrentOverride {
  temp: number;
  label: string;
  icon: string;
}

/**
 * Real, observed current conditions from the US National Weather Service
 * (keyless, CORS-enabled, station observations). Returns null outside the US
 * or on any failure — far more accurate than model-derived codes for the
 * "right now" condition (e.g. avoids phantom thunderstorms). We still use
 * Open-Meteo for the forecast structure and everywhere NWS doesn't cover.
 */
export async function fetchNWSCurrent(
  lat: number,
  lon: number,
  fahrenheit = true,
  isDay = true
): Promise<CurrentOverride | null> {
  try {
    const pts = await fetchWithTimeout(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
    if (!pts.ok) return null;
    const stationsUrl = (await pts.json())?.properties?.observationStations;
    if (!stationsUrl) return null;

    const st = await fetchWithTimeout(stationsUrl);
    if (!st.ok) return null;
    const stationUrl = (await st.json())?.features?.[0]?.id;
    if (!stationUrl) return null;

    const obs = await fetchWithTimeout(`${stationUrl}/observations/latest`);
    if (!obs.ok) return null;
    const p = (await obs.json())?.properties;
    const celsius = p?.temperature?.value;
    if (typeof celsius !== 'number') return null;

    const label = (p.textDescription || '').trim() || 'Current';
    return {
      temp: Math.round(fahrenheit ? celsius * (9 / 5) + 32 : celsius),
      label,
      icon: iconForText(label, isDay)
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number, fahrenheit = true): Promise<WeatherData> {
  const unit = fahrenheit ? 'fahrenheit' : 'celsius';
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&temperature_unit=${unit}&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const d = await res.json();

  const code = d.current.weather_code as number;
  const desc = describeCode(code);
  const nowIso = d.current.time as string;
  const startIdx = Math.max(0, (d.hourly.time as string[]).indexOf(nowIso));

  return {
    unit: fahrenheit ? '°F' : '°C',
    now: {
      temp: Math.round(d.current.temperature_2m),
      code,
      isDay: d.current.is_day === 1,
      label: desc.label,
      icon: desc.icon
    },
    hourly: (d.hourly.time as string[]).slice(startIdx, startIdx + 12).map((time, i) => ({
      time,
      temp: Math.round(d.hourly.temperature_2m[startIdx + i]),
      code: d.hourly.weather_code[startIdx + i]
    })),
    daily: (d.daily.time as string[]).map((date, i) => ({
      date,
      min: Math.round(d.daily.temperature_2m_min[i]),
      max: Math.round(d.daily.temperature_2m_max[i]),
      code: d.daily.weather_code[i]
    }))
  };
}
