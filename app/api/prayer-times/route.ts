import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes
} from "adhan";
import { findPrayerLocation, loadPrayerLocations } from "../../lib/prayerLocations";
import type { PrayerLocationOption } from "../../lib/types";

export const dynamic = "force-dynamic";

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const hasTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const toNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day")
  };
};

const toDateFromParts = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const toDateForTimeZone = (timeZone: string, dateParam?: string | null) => {
  if (dateParam && DATE_PATTERN.test(dateParam)) {
    const [year, month, day] = dateParam.split("-").map(Number);
    return toDateFromParts(year || 0, month || 1, day || 1);
  }
  const parts = toDateParts(new Date(), timeZone);
  return toDateFromParts(parts.year, parts.month, parts.day);
};

const toHm = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value || "00";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  return `${hour}:${minute}`;
};

const toDisplayTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  }).format(date);

const methodFromId = (id: string) => {
  const methodId = String(id || "MWL").toUpperCase();
  switch (methodId) {
    case "ISNA":
      return CalculationMethod.NorthAmerica();
    case "EGYPT":
      return CalculationMethod.Egyptian();
    case "MAKKAH":
      return CalculationMethod.UmmAlQura();
    case "KARACHI":
      return CalculationMethod.Karachi();
    case "DUBAI":
      return CalculationMethod.Dubai();
    case "QATAR":
      return CalculationMethod.Qatar();
    case "KUWAIT":
      return CalculationMethod.Kuwait();
    case "SINGAPORE":
      return CalculationMethod.Singapore();
    case "TURKEY":
      return CalculationMethod.Turkey();
    case "MOROCCO": {
      const custom = CalculationMethod.Other();
      custom.fajrAngle = 19;
      custom.ishaAngle = 17;
      return custom;
    }
    case "MWL":
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
};

const resolveLocation = async ({
  latitude,
  longitude,
  countryCode,
  city
}: {
  latitude: number | null;
  longitude: number | null;
  countryCode: string;
  city: string;
}): Promise<PrayerLocationOption | null> => {
  if (latitude !== null && longitude !== null) {
    return {
      countryCode: countryCode || "",
      country: "",
      city: city || "",
      latitude,
      longitude,
      timezone: "",
      geonameId: null
    };
  }

  if (!countryCode || !city) return null;
  const locations = await loadPrayerLocations();
  return findPrayerLocation(locations, countryCode, city);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = String(searchParams.get("countryCode") || "")
    .toUpperCase()
    .trim();
  const city = String(searchParams.get("city") || "").trim();
  const latitude = toNumber(searchParams.get("latitude"));
  const longitude = toNumber(searchParams.get("longitude"));
  const method = String(searchParams.get("method") || "MWL").toUpperCase().trim();
  const madhab = String(searchParams.get("madhab") || "SHAFI").toUpperCase().trim();
  const requestTimeZone = String(searchParams.get("timezone") || "").trim();
  const dateParam = searchParams.get("date");

  if (countryCode && !COUNTRY_CODE_PATTERN.test(countryCode)) {
    return NextResponse.json(
      { error: "Invalid countryCode. Use ISO 2-letter code." },
      { status: 400 }
    );
  }

  if (dateParam && !DATE_PATTERN.test(dateParam)) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const resolvedLocation = await resolveLocation({ latitude, longitude, countryCode, city });
    if (!resolvedLocation) {
      return NextResponse.json(
        { error: "Location not found. Choose a city from the location list." },
        { status: 404 }
      );
    }

    const lat = resolvedLocation.latitude;
    const lng = resolvedLocation.longitude;
    const fallbackTimeZone = resolvedLocation.timezone || "UTC";
    const timeZone = hasTimeZone(requestTimeZone)
      ? requestTimeZone
      : hasTimeZone(fallbackTimeZone)
      ? fallbackTimeZone
      : "UTC";

    const coordinates = new Coordinates(lat, lng);
    const params = methodFromId(method);
    params.madhab = madhab === "HANAFI" ? Madhab.Hanafi : Madhab.Shafi;
    params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);

    const baseDate = toDateForTimeZone(timeZone, dateParam);
    const prayerTimes = new PrayerTimes(coordinates, baseDate, params);
    const now = new Date();
    const todayTimeline = [
      { name: "Fajr", date: prayerTimes.fajr },
      { name: "Dhuhr", date: prayerTimes.dhuhr },
      { name: "Asr", date: prayerTimes.asr },
      { name: "Maghrib", date: prayerTimes.maghrib },
      { name: "Isha", date: prayerTimes.isha }
    ];

    const tomorrowDate = new Date(baseDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrowDate, params);
    const timeline = [...todayTimeline, { name: "Fajr", date: tomorrowTimes.fajr }];
    const nextPrayer = timeline.find((item) => item.date.getTime() > now.getTime()) || timeline[0];

    return NextResponse.json({
      source: "adhan-js",
      location: {
        countryCode: resolvedLocation.countryCode || countryCode,
        country: resolvedLocation.country,
        city: resolvedLocation.city || city,
        latitude: lat,
        longitude: lng,
        timezone: timeZone,
        geonameId: resolvedLocation.geonameId
      },
      calculation: {
        method,
        madhab: madhab === "HANAFI" ? "HANAFI" : "SHAFI",
        highLatitudeRule: params.highLatitudeRule
      },
      date: {
        gregorian: `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`
      },
      timings: {
        Fajr: { time: toHm(prayerTimes.fajr, timeZone), display: toDisplayTime(prayerTimes.fajr, timeZone) },
        Dhuhr: { time: toHm(prayerTimes.dhuhr, timeZone), display: toDisplayTime(prayerTimes.dhuhr, timeZone) },
        Asr: { time: toHm(prayerTimes.asr, timeZone), display: toDisplayTime(prayerTimes.asr, timeZone) },
        Maghrib: { time: toHm(prayerTimes.maghrib, timeZone), display: toDisplayTime(prayerTimes.maghrib, timeZone) },
        Isha: { time: toHm(prayerTimes.isha, timeZone), display: toDisplayTime(prayerTimes.isha, timeZone) }
      },
      nextPrayer: {
        name: nextPrayer.name,
        time: toHm(nextPrayer.date, timeZone),
        display: toDisplayTime(nextPrayer.date, timeZone)
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to calculate prayer times right now." },
      { status: 502 }
    );
  }
}
