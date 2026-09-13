"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Plus,
  X,
  Search,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { weatherCodeToCondition, type DailyPoint } from "@/lib/weather";

type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  currentTemp: number | null;
  weatherCode: number | null;
  todayMax: number | null;
  todayMin: number | null;
};

type SearchResult = { name: string; country?: string; admin1?: string; latitude: number; longitude: number };

const ICONS = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
};

function ConditionIcon({ code, size = 28, className }: { code: number | null; size?: number; className?: string }) {
  const condition = weatherCodeToCondition(code);
  const Icon = ICONS[condition.icon];
  return <Icon size={size} className={className} />;
}

export default function WeatherCard() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ["weather-locations"],
    queryFn: () => apiFetch("/api/weather"),
  });

  const removeLocation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/weather/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weather-locations"] }),
  });

  return (
    <div className="card md:col-span-1">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">Weather</h2>
        <button
          onClick={() => setAdding(true)}
          className="text-ink-light hover:text-sage-500"
          title="Add a location"
        >
          <Plus size={18} />
        </button>
      </div>

      {isLoading && <p className="text-sm text-ink-light">Loading weather...</p>}

      {!isLoading && (!locations || locations.length === 0) && (
        <p className="text-sm text-ink-light">
          Add a city to see the forecast.{" "}
          <button onClick={() => setAdding(true)} className="text-sage-600 underline">
            Add one
          </button>
          .
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {locations?.map((loc) => (
          <div key={loc.id} className="group relative">
            <button
              onClick={() => setDetailId(loc.id)}
              className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-2 text-left hover:border-sage-400"
            >
              <ConditionIcon code={loc.weatherCode} size={22} className="shrink-0 text-sage-500" />
              <span>
                <span className="block text-sm font-medium leading-tight">
                  {loc.currentTemp !== null ? `${Math.round(loc.currentTemp)}°C` : "—"}
                </span>
                <span className="block text-xs leading-tight text-ink-light">{loc.name}</span>
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeLocation.mutate(loc.id);
              }}
              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-cream-300 text-ink-light hover:bg-red-100 hover:text-red-500 group-hover:flex"
              title="Remove location"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {adding && <AddLocationModal onClose={() => setAdding(false)} />}
      {detailId && <LocationDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function AddLocationModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const addLocation = useMutation({
    mutationFn: (loc: SearchResult) =>
      apiFetch("/api/weather", {
        method: "POST",
        body: JSON.stringify({
          name: loc.admin1 && loc.admin1 !== loc.name ? `${loc.name}, ${loc.admin1}` : loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather-locations"] });
      onClose();
    },
  });

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await apiFetch<{ results: SearchResult[] }>(`/api/weather/search?q=${encodeURIComponent(query)}`);
      setResults(data.results || []);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">Add a location</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            className="input flex-1"
            placeholder="Search a city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button onClick={search} className="btn-secondary px-3" disabled={searching}>
            <Search size={16} />
          </button>
        </div>
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => addLocation.mutate(r)}
                className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-cream-100"
                disabled={addLocation.isPending}
              >
                {r.name}
                {r.admin1 && r.admin1 !== r.name ? `, ${r.admin1}` : ""}
                {r.country ? ` · ${r.country}` : ""}
              </button>
            </li>
          ))}
          {searching && <li className="px-2 py-2 text-sm text-ink-light">Searching...</li>}
          {!searching && results.length === 0 && query && (
            <li className="px-2 py-2 text-sm text-ink-light">No results yet — try searching.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function LocationDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ location: { name: string }; days: DailyPoint[] }>({
    queryKey: ["weather-history", id],
    queryFn: () => apiFetch(`/api/weather/${id}/history`),
  });

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const temps = (data?.days || []).flatMap((d) => [d.max, d.min]).filter((n): n is number => n !== null);
  const maxTemp = temps.length ? Math.max(...temps) : 1;
  const minTemp = temps.length ? Math.min(...temps) : 0;
  const range = Math.max(maxTemp - minTemp, 1);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="card w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">{data?.location?.name || "Weather"}</h3>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {isLoading && <p className="text-sm text-ink-light">Loading forecast...</p>}
        {!isLoading && (
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2">
            {data?.days.map((d) => {
              const isToday = d.date === todayKey;
              const condition = weatherCodeToCondition(d.code);
              const Icon = ICONS[condition.icon];
              const barTop = d.max !== null ? ((maxTemp - d.max) / range) * 40 : 40;
              const barHeight = d.max !== null && d.min !== null ? Math.max(((d.max - d.min) / range) * 40, 4) : 4;
              return (
                <div
                  key={d.date}
                  className={cn(
                    "flex min-w-[76px] flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center",
                    isToday ? "border-sage-400 bg-sage-50" : "border-cream-300"
                  )}
                >
                  <span className="text-xs font-medium text-ink-light">
                    {isToday ? "Today" : format(parseISO(d.date), "EEE d")}
                  </span>
                  <Icon size={22} className="text-sage-500" />
                  <div className="relative h-10 w-1.5 rounded-full bg-cream-200">
                    <div
                      className="absolute w-1.5 rounded-full bg-sage-400"
                      style={{ top: `${barTop}px`, height: `${barHeight}px` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{d.max !== null ? `${Math.round(d.max)}°` : "—"}</span>
                  <span className="text-xs text-ink-light">{d.min !== null ? `${Math.round(d.min)}°` : "—"}</span>
                  <span className="text-[10px] leading-tight text-ink-light">{condition.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-ink-light">Past 7 days through next 7 days, in °C.</p>
      </div>
    </div>
  );
}
