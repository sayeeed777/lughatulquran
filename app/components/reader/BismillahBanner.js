"use client";

import { BISMILLAH, BISMILLAH_TRANSLATION, NO_BISMILLAH_SURAHS } from "../../lib/constants";

/** @param {{ surahNumber?: number }} props */
export default function BismillahBanner({ surahNumber }) {
  // Don't show for Al-Fatihah (Bismillah is ayah 1) or At-Tawbah (no Bismillah)
  if (Number.isFinite(surahNumber) && NO_BISMILLAH_SURAHS.includes(surahNumber)) {
    return null;
  }

  return (
    <div className="bismillah-banner">
      <p className="bismillah-arabic" lang="ar" dir="rtl">
        {BISMILLAH}
      </p>
      <p className="bismillah-translation">
        {BISMILLAH_TRANSLATION}
      </p>
    </div>
  );
}
