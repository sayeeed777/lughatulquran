"use client";

const ALL_TRANSLATIONS = [
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
}) {
  if (!selectedAyah || !selectedSurah) {
    return null;
  }

  const taqiText = selectedAyahKey ? taqiCache[selectedAyahKey] : null;
  const formatArabic = (text) => text;

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
                {isTaqi && taqiLoading[selectedAyahKey]
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
