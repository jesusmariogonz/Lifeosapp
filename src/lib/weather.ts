// Shared helpers for the Open-Meteo weather integration.
// Docs: https://open-meteo.com/en/docs (WMO weather interpretation codes table)

export type WeatherCondition = {
  label: string;
  icon: "sun" | "cloud-sun" | "cloud" | "cloud-fog" | "cloud-drizzle" | "cloud-rain" | "cloud-snow" | "cloud-lightning";
};

// Small lookup table grouping WMO weathercodes into human-readable conditions.
// Not exhaustive of every code — sensible groupings per the task brief.
export function weatherCodeToCondition(code: number | null | undefined): WeatherCondition {
  if (code === null || code === undefined) return { label: "Unknown", icon: "cloud" };
  if (code === 0) return { label: "Clear sky", icon: "sun" };
  if (code === 1 || code === 2) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "cloud-fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "cloud-drizzle" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: "Rain", icon: "cloud-rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Snow", icon: "cloud-snow" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", icon: "cloud-lightning" };
  return { label: "Cloudy", icon: "cloud" };
}

export type DailyPoint = {
  date: string; // yyyy-mm-dd
  max: number | null;
  min: number | null;
  code: number | null;
};

export type OpenMeteoDaily = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weathercode: number[];
};

export function dailyToPoints(daily: OpenMeteoDaily | undefined | null): DailyPoint[] {
  if (!daily?.time) return [];
  return daily.time.map((date, i) => ({
    date,
    max: daily.temperature_2m_max?.[i] ?? null,
    min: daily.temperature_2m_min?.[i] ?? null,
    code: daily.weathercode?.[i] ?? null,
  }));
}

export type HourlyPoint = {
  time: string; // ISO, e.g. "2026-09-14T14:00"
  temp: number | null;
  code: number | null;
};

export type OpenMeteoHourly = {
  time: string[];
  temperature_2m: number[];
  weathercode: number[];
};

export function hourlyToPoints(hourly: OpenMeteoHourly | undefined | null): HourlyPoint[] {
  if (!hourly?.time) return [];
  return hourly.time.map((time, i) => ({
    time,
    temp: hourly.temperature_2m?.[i] ?? null,
    code: hourly.weathercode?.[i] ?? null,
  }));
}
