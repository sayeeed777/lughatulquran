"use client";

type Translation = { id: string; label: string };

type AyahTranslation = { text?: string };

type Ayah = {
  number: number;
  arabic?: string;
  translations?: Record<string, AyahTranslation>;
};

type Surah = {
  name: string;
  englishName: string;
};

type CompareModalProps = {
  selectedAyah: Ayah | null;
  selectedSurah: Surah | null;
  selectedAyahKey: string | null;
  taqiCache: Record<string, string>;
  taqiLoading: Record<string, boolean>;
  onClose: () => void;
};

const ALL_TRANSLATIONS: Translation[] = [
  { id: "en.sahih", label: "Sahih International" },
  { id: "en.arberry", label: "A.J. Arberry" },
  { id: "en.pickthall", label: "Pickthall" },
  { id: "en.yusufali", label: "Yusuf Ali" },
  { id: "taqi-usmani", label: "Mufti Taqi Usmani" }
];

export default function CompareModal({
  selectedAyah,
  selectedSurah,
  selectedAyahKey,
  taqiCache,
  taqiLoading,
  onClose
}: CompareModalProps) {
  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const taqiText = selectedAyahKey ? taqiCache[selectedAyahKey] : null;
  const isTaqiLoading = selectedAyahKey ? taqiLoading[selectedAyahKey] : false;
  const formatArabic = (text?: string) => text ?? "";

  return (
    <div className="compare-panel" role="dialog" aria-modal="true">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Ayah {selectedAyah.number}</p>
          <h3>
            {selectedSurah.englishName} - {selectedSurah.name}
          </h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="compare-body">
        <div className="compare-block">
          <p className="label">Arabic (Uthmani)</p>
          <p className="ayah-arabic" lang="ar" dir="rtl">
            {formatArabic(selectedAyah.arabic)}
          </p>
        </div>
        {ALL_TRANSLATIONS.map((translation) => {
          const isTaqi = translation.id === "taqi-usmani";
          const translationText = isTaqi
            ? taqiText
            : selectedAyah.translations?.[translation.id]?.text;
          return (
            <div key={translation.id} className="compare-block">
              <p className="label">{translation.label}</p>
              <p className="compare-text">
                {isTaqi && isTaqiLoading
                  ? "Loading translation..."
                  : translationText || "Translation unavailable."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
