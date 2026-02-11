import { describe, expect, it } from "vitest";
import type { PrayerLocationOption } from "./types";
import { findPrayerLocation, searchPrayerLocations } from "./prayerLocations";

const LOCATIONS: PrayerLocationOption[] = [
  {
    countryCode: "US",
    country: "United States",
    city: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
    geonameId: 5128581
  },
  {
    countryCode: "US",
    country: "United States",
    city: "York",
    latitude: 39.9626,
    longitude: -76.7277,
    timezone: "America/New_York",
    geonameId: 4562407
  },
  {
    countryCode: "US",
    country: "United States",
    city: "St. Louis",
    latitude: 38.627,
    longitude: -90.1994,
    timezone: "America/Chicago",
    geonameId: 4407066
  },
  {
    countryCode: "GB",
    country: "United Kingdom",
    city: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
    geonameId: 2643743
  }
];

describe("prayer location search", () => {
  it("ranks direct and prefix matches first", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "new yo",
      limit: 5
    });
    expect(results[0]?.city).toBe("New York");
  });

  it("matches tokenized city queries in any order", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "york new",
      limit: 5
    });
    expect(results[0]?.city).toBe("New York");
  });

  it("matches punctuation-insensitive queries", () => {
    const results = searchPrayerLocations(LOCATIONS, {
      countryCode: "US",
      query: "stlouis",
      limit: 5
    });
    expect(results[0]?.city).toBe("St. Louis");
  });
});

describe("find prayer location", () => {
  it("resolves partial and punctuation-insensitive city names", () => {
    const found = findPrayerLocation(LOCATIONS, "US", "st louis");
    expect(found?.geonameId).toBe(4407066);
  });
});
