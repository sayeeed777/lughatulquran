import type { PrayerLocationOption } from "./types";
import prayerLocationsSupplemental from "../data/prayerLocationsSupplemental.json";

const DEFAULT_DATASET_URL =
  "https://cdn.jsdelivr.net/gh/sayeeed777/prayer-locations-data@main/locations.json";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type PrayerLocationPayload =
  | PrayerLocationOption[]
  | { locations?: PrayerLocationOption[] };

type PrayerLocationCache = {
  loadedAt: number;
  locations: PrayerLocationOption[];
};

let prayerLocationCache: PrayerLocationCache | null = null;

const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const normalizeForMatch = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bpanjab\b/g, "punjab");

const compactText = (value: string) => value.replace(/\s+/g, "");

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPrayerLocation = (item: unknown): PrayerLocationOption | null => {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const countryCode = String(record.countryCode || "").toUpperCase().trim();
  const country = String(record.country || "").trim();
  const city = String(record.city || "").trim();
  const timezone = String(record.timezone || "").trim();
  const latitude = toNumber(record.latitude);
  const longitude = toNumber(record.longitude);
  const geonameId = toNumber(record.geonameId);

  if (!countryCode || !country || !city || !timezone) return null;
  if (latitude === null || longitude === null) return null;

  return {
    countryCode,
    country,
    city,
    latitude,
    longitude,
    timezone,
    geonameId
  };
};

const parsePayload = (payload: PrayerLocationPayload): PrayerLocationOption[] => {
  const rawList = Array.isArray(payload) ? payload : payload?.locations;
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => toPrayerLocation(item))
    .filter((item): item is PrayerLocationOption => Boolean(item));
};

const toLocationKey = (location: PrayerLocationOption) =>
  Number.isFinite(location.geonameId)
    ? `gid:${location.geonameId}`
    : `${location.countryCode}:${normalizeForMatch(location.city)}:${location.latitude}:${location.longitude}`;

const mergeLocations = (...lists: PrayerLocationOption[][]) => {
  const merged = new Map<string, PrayerLocationOption>();
  for (const list of lists) {
    for (const location of list) {
      const key = toLocationKey(location);
      if (!merged.has(key)) {
        merged.set(key, location);
      }
    }
  }
  return Array.from(merged.values());
};

const supplementalLocations = parsePayload(prayerLocationsSupplemental as PrayerLocationPayload);

export async function loadPrayerLocations(): Promise<PrayerLocationOption[]> {
  const now = Date.now();
  if (prayerLocationCache && now - prayerLocationCache.loadedAt < CACHE_TTL_MS) {
    return prayerLocationCache.locations;
  }

  const datasetUrl = process.env.PRAYER_LOCATIONS_DATASET_URL || DEFAULT_DATASET_URL;
  let remoteLocations: PrayerLocationOption[] = [];

  try {
    const response = await fetch(datasetUrl, {
      next: { revalidate: 21600 }
    });
    if (response.ok) {
      const payload = (await response.json()) as PrayerLocationPayload;
      remoteLocations = parsePayload(payload);
    }
  } catch {
    remoteLocations = [];
  }

  const locations = mergeLocations(remoteLocations, supplementalLocations);
  if (!locations.length) {
    throw new Error("No prayer locations available.");
  }

  prayerLocationCache = {
    loadedAt: now,
    locations
  };
  return locations;
}

type SearchParams = {
  countryCode?: string;
  query?: string;
  limit?: number;
};

export function searchPrayerLocations(
  locations: PrayerLocationOption[],
  { countryCode, query, limit = 20 }: SearchParams
) {
  const normalizedCountry = String(countryCode || "").toUpperCase().trim();
  const normalizedQuery = normalizeForMatch(String(query || ""));
  const compactQuery = compactText(normalizedQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 20, 50));

  let filtered = locations;
  if (normalizedCountry) {
    filtered = filtered.filter((item) => item.countryCode === normalizedCountry);
  }

  if (!normalizedQuery) {
    return filtered
      .slice()
      .sort((a, b) => a.city.localeCompare(b.city) || a.country.localeCompare(b.country))
      .slice(0, boundedLimit);
  }

  return filtered
    .map((item) => {
      const city = normalizeForMatch(item.city);
      const country = normalizeForMatch(item.country);
      const compactCity = compactText(city);
      const compactCountry = compactText(country);
      const combined = `${city} ${country} ${item.countryCode.toLowerCase()}`.trim();
      const compactCombined = compactText(combined);
      const cityWords = city.split(" ").filter(Boolean);

      let score = Number.POSITIVE_INFINITY;
      if (city === normalizedQuery || compactCity === compactQuery) score = 0;
      else if (city.startsWith(normalizedQuery) || compactCity.startsWith(compactQuery)) score = 1;
      else if (cityWords.some((word) => word.startsWith(normalizedQuery))) score = 2;
      else if (queryTokens.length > 1 && queryTokens.every((token) => city.includes(token))) score = 2;
      else if (city.includes(normalizedQuery) || compactCity.includes(compactQuery)) score = 3;
      else if (queryTokens.length > 1 && queryTokens.every((token) => combined.includes(token))) score = 4;
      else if (country.startsWith(normalizedQuery) || country.includes(normalizedQuery)) score = 5;
      else if (compactCountry.includes(compactQuery)) score = 5;
      else if (combined.includes(normalizedQuery) || compactCombined.includes(compactQuery)) score = 6;

      return { item, score };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.item.city.length !== b.item.city.length) return a.item.city.length - b.item.city.length;
      return a.item.city.localeCompare(b.item.city) || a.item.country.localeCompare(b.item.country);
    })
    .slice(0, boundedLimit)
    .map((entry) => entry.item);
}

export function findPrayerLocation(
  locations: PrayerLocationOption[],
  countryCode: string,
  city: string
) {
  const normalizedCountry = String(countryCode || "").toUpperCase().trim();
  const normalizedCity = normalizeForMatch(city);
  const compactQuery = compactText(normalizedCity);
  if (!normalizedCountry || !normalizedCity) return null;

  let exact = locations.find(
    (item) =>
      item.countryCode === normalizedCountry &&
      normalizeText(item.city) === normalizedCity
  );
  if (exact) return exact;

  exact = locations.find(
    (item) =>
      item.countryCode === normalizedCountry &&
      normalizeForMatch(item.city).startsWith(normalizedCity)
  );
  if (exact) return exact;

  exact = locations.find((item) => {
    if (item.countryCode !== normalizedCountry) return false;
    const cityName = normalizeForMatch(item.city);
    const compactCity = compactText(cityName);
    return (
      cityName.includes(normalizedCity)
      || normalizedCity.includes(cityName)
      || compactCity.includes(compactQuery)
      || compactQuery.includes(compactCity)
    );
  });
  if (exact) return exact;

  return null;
}
