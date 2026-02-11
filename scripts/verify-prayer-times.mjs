import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes
} from "adhan";

const samples = [
  {
    label: "Dhaka",
    latitude: 23.8103,
    longitude: 90.4125,
    timezone: "Asia/Dhaka",
    method: "KARACHI",
    school: 1
  },
  {
    label: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
    method: "MWL",
    school: 0
  },
  {
    label: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    timezone: "America/New_York",
    method: "ISNA",
    school: 0
  },
  {
    label: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    timezone: "America/Toronto",
    method: "ISNA",
    school: 0
  }
];

const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const alAdhanMethodById = {
  MWL: 3,
  ISNA: 2,
  EGYPT: 5,
  MAKKAH: 4,
  KARACHI: 1,
  DUBAI: 16,
  QATAR: 10,
  KUWAIT: 9,
  SINGAPORE: 11,
  TURKEY: 13,
  MOROCCO: 3
};

const methodFromId = (id) => {
  switch (id) {
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

const toDateParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day")
  };
};

const toHm = (date, timeZone) => {
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

const toMinutes = (value) => {
  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
};

const computeLocalTimings = (sample) => {
  const params = methodFromId(sample.method);
  params.madhab = sample.school === 1 ? Madhab.Hanafi : Madhab.Shafi;
  const coordinates = new Coordinates(sample.latitude, sample.longitude);
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  const parts = toDateParts(new Date(), sample.timezone);
  const date = new Date(parts.year, parts.month - 1, parts.day);
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  return {
    Fajr: toHm(prayerTimes.fajr, sample.timezone),
    Dhuhr: toHm(prayerTimes.dhuhr, sample.timezone),
    Asr: toHm(prayerTimes.asr, sample.timezone),
    Maghrib: toHm(prayerTimes.maghrib, sample.timezone),
    Isha: toHm(prayerTimes.isha, sample.timezone)
  };
};

const fetchAlAdhan = async (sample) => {
  const method = alAdhanMethodById[sample.method] || alAdhanMethodById.MWL;
  const url = new URL("https://api.aladhan.com/v1/timings");
  url.searchParams.set("latitude", String(sample.latitude));
  url.searchParams.set("longitude", String(sample.longitude));
  url.searchParams.set("method", String(method));
  url.searchParams.set("school", String(sample.school));
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`AlAdhan request failed for ${sample.label}`);
  }
  const payload = await response.json();
  return payload?.data?.timings || {};
};

for (const sample of samples) {
  const local = computeLocalTimings(sample);
  const remote = await fetchAlAdhan(sample);

  console.log(`\n${sample.label}`);
  for (const prayer of prayerOrder) {
    const localTime = local[prayer];
    const remoteTime = remote?.[prayer];
    const delta = toMinutes(localTime) - toMinutes(remoteTime);
    const sign = delta > 0 ? "+" : "";
    console.log(`${prayer}: local=${localTime} aladhan=${remoteTime} delta=${sign}${delta}m`);
  }
}
