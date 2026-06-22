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

/** Cupertino — used when geolocation is denied or unavailable. */
export const FALLBACK_COORDS = { lat: 37.323, lon: -122.0322, label: 'Cupertino' };

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

/** Resolve the user's coordinates, falling back gracefully. */
export function getCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ lat: FALLBACK_COORDS.lat, lon: FALLBACK_COORDS.lon });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: FALLBACK_COORDS.lat, lon: FALLBACK_COORDS.lon }),
      { timeout: 8000, maximumAge: 600_000 }
    );
  });
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
