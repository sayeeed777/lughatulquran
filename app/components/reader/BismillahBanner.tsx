"use client";

import { BISMILLAH, BISMILLAH_TRANSLATION, NO_BISMILLAH_SURAHS } from "../../lib/constants";

type BismillahBannerProps = {
  surahNumber?: number;
};

export default function BismillahBanner({ surahNumber }: BismillahBannerProps) {
  // Don't show for Al-Fatihah (Bismillah is ayah 1) or At-Tawbah (no Bismillah)
  if (Number.isFinite(surahNumber) && NO_BISMILLAH_SURAHS.includes(surahNumber as number)) {
    return null;
  }

  return (
    <div className="bismillah-banner">
      <p className="bismillah-arabic" lang="ar" dir="rtl">
        {BISMILLAH}
      </p>
      <p className="bismillah-translation">{BISMILLAH_TRANSLATION}</p>
    </div>
  );
}
