import { NextResponse } from "next/server";

const EDITIONS = [
  "quran-uthmani",
  "en.arberry",
  "en.pickthall",
  "en.yusufali",
  "en.sahih"
];

const EDITION_LABELS = {
  "en.arberry": "A.J. Arberry",
  "en.pickthall": "Pickthall",
  "en.yusufali": "Yusuf Ali",
  "en.sahih": "Sahih International"
};

const QF_BASE_URL = "https://apis.quran.foundation/content/api/v4";
const QF_CLIENT_ID = process.env.QURAN_API_CLIENT_ID;
const QF_TOKEN = process.env.QURAN_API_TOKEN;

export const revalidate = 86400;

const fetchQpcHafs = async (chapterId) => {
  if (!QF_CLIENT_ID || !QF_TOKEN) {
    return null;
  }

  const verses = [];
  let page = 1;
  let safety = 0;
  let hasNext = true;

  while (hasNext && safety < 20) {
    safety += 1;
    const url = new URL(`${QF_BASE_URL}/quran/verses/qpc_hafs`);
    url.searchParams.set("chapter_number", chapterId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "50");

    const response = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        "x-client-id": QF_CLIENT_ID,
        "x-auth-token": QF_TOKEN,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const chunk = payload?.verses ?? payload?.data ?? [];

    for (const verse of chunk) {
      const verseNumber =
        verse.verse_number ||
        Number(String(verse.verse_key || "").split(":")[1]);
      const text =
        verse.text_qpc_hafs ||
        verse.text ||
        verse.text_uthmani ||
        verse.text_imlaei ||
        null;

      if (verseNumber && text) {
        verses.push({ number: verseNumber, text });
      }
    }

    const pagination = payload?.pagination ?? payload?.meta?.pagination;
    if (pagination?.next_page) {
      page = pagination.next_page;
      continue;
    }

    if (
      pagination?.current_page &&
      pagination?.total_pages &&
      pagination.current_page < pagination.total_pages
    ) {
      page += 1;
      continue;
    }

    hasNext = chunk.length === 50;
    if (hasNext) {
      page += 1;
    }
  }

  return verses.length ? verses : null;
};

export async function GET(_request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing surah id." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${id}/editions/${EDITIONS.join(",")}`,
      {
        next: { revalidate: 86400 }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch surah data." },
        { status: 502 }
      );
    }

    const payload = await response.json();

    if (!payload || !payload.data) {
      return NextResponse.json(
        { error: "Unexpected response from Quran API." },
        { status: 502 }
      );
    }

    const editions = payload.data;
    const editionById = new Map(
      editions.map((edition) => [edition.edition.identifier, edition])
    );

    const arabicEdition = editionById.get("quran-uthmani");
    if (!arabicEdition) {
      return NextResponse.json(
        { error: "Arabic edition missing from API response." },
        { status: 502 }
      );
    }

    const ayahMap = new Map();
    for (const ayah of arabicEdition.ayahs) {
      ayahMap.set(ayah.numberInSurah, {
        number: ayah.numberInSurah,
        arabic: ayah.text,
        translations: {}
      });
    }

    const qpcVerses = await fetchQpcHafs(id);
    let arabicScript = "uthmani";
    if (qpcVerses) {
      arabicScript = "qpc_hafs";
      for (const verse of qpcVerses) {
        const entry = ayahMap.get(verse.number);
        if (entry) {
          entry.arabic = verse.text;
        }
      }
    }

    for (const [identifier, label] of Object.entries(EDITION_LABELS)) {
      const edition = editionById.get(identifier);
      if (!edition) {
        continue;
      }

      for (const ayah of edition.ayahs) {
        const entry = ayahMap.get(ayah.numberInSurah);
        if (entry) {
          entry.translations[identifier] = {
            label,
            text: ayah.text
          };
        }
      }
    }

    const ayahs = Array.from(ayahMap.values()).sort(
      (a, b) => a.number - b.number
    );

    const surahMeta = {
      number: arabicEdition.number,
      name: arabicEdition.name,
      englishName: arabicEdition.englishName,
      englishNameTranslation: arabicEdition.englishNameTranslation,
      numberOfAyahs: arabicEdition.numberOfAyahs,
      revelationType: arabicEdition.revelationType
    };

    return NextResponse.json({
      surah: surahMeta,
      ayahs,
      arabicScript,
      translationOrder: [
        "en.sahih",
        "en.arberry",
        "en.pickthall",
        "en.yusufali"
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach Quran API." },
      { status: 502 }
    );
  }
}
