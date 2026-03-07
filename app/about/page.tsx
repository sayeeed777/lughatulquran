import Link from "next/link";
import type { Metadata } from "next";
import { getCspNonce } from "../lib/csp";

export const metadata: Metadata = {
  title: "About OpenFurqan — Free Open-Source Quran Reader with Study Tools",
  description:
    "OpenFurqan is a free, open-source Quran reading web application with 22+ translations, 9+ reciters, word-by-word analysis, Tajweed colors, memorization tools, Tafsir, prayer times, and more.",
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "About OpenFurqan — Free Open-Source Quran Reader",
    description:
      "A free, open-source Quran reading web application with translations, audio recitation, study tools, memorization, Tajweed, Tafsir, and more.",
    url: "https://openfurqan.com/about",
    siteName: "OpenFurqan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "About OpenFurqan — Free Open-Source Quran Reader",
    description:
      "A free, open-source Quran reading web application with translations, audio recitation, study tools, memorization, Tajweed, Tafsir, and more."
  }
};

export default async function AboutPage() {
  const nonce = await getCspNonce();

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpenFurqan",
    url: "https://openfurqan.com",
    description:
      "OpenFurqan is a free, open-source Quran reading web application with translations, audio, study tools, and more."
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "OpenFurqan",
    url: "https://openfurqan.com",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    description:
      "A free, open-source Quran reading web application with 22+ translations across 7+ languages, 9+ audio reciters, word-by-word analysis, Tajweed color-coding, memorization tools, Tafsir, prayer times, and study features.",
    featureList: [
      "22+ Quran translations in 7+ languages",
      "9+ audio reciters with adjustable playback speed",
      "Word-by-word Arabic analysis with root and morphology",
      "15+ color-coded Tajweed pronunciation rules",
      "Study Mode with bookmarks, notes, and reading plans",
      "Hifz memorization mode with repetition loops",
      "7+ Tafsir editions",
      "Prayer times for 31+ countries",
      "Arabic root lexicon with Lane's Lexicon definitions",
      "Reading statistics and streak tracking",
      "4 visual themes including dark mode",
      "Full keyboard shortcuts",
      "Offline support as Progressive Web App",
      "Customizable Arabic fonts and text sizes"
    ],
    inLanguage: ["ar", "en", "bn", "ur"]
  };

  return (
    <div className="seo-page">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      <div className="seo-container">
        <header className="seo-header">
          <h1 className="seo-english-title">About OpenFurqan</h1>
          <p className="seo-translation">
            Free, open-source Quran reader with deep study tools
          </p>
        </header>

        {/* What is OpenFurqan */}
        <section className="info-section">
          <h2 className="info-section-title">What is OpenFurqan</h2>
          <p className="info-text">
            OpenFurqan is a free, open-source Quran reading web application built around two focused
            experiences: distraction-free reading with clean Arabic text and 22+ translations across
            7+ languages, and a deep Study Mode with word-by-word analysis, Arabic root dictionary,
            Tajweed color-coding, Tafsir from 7+ editions, Hifz memorization tools, bookmarks,
            personal notes, reading plans, and progress tracking. Audio recitation is available from
            9+ well-known reciters. No account, no ads, no payment required.
          </p>
        </section>

        {/* Why OpenFurqan Exists */}
        <section className="info-section">
          <h2 className="info-section-title">Why OpenFurqan Exists</h2>
          <p className="info-text">
            Most Quran websites focus only on reading. OpenFurqan combines reading, studying,
            memorizing, and listening into a single fast interface — with tools like Lane&#39;s Lexicon
            for word roots, 15+ color-coded Tajweed rules, customizable memorization loops, and daily
            reading statistics with streaks. The project is independently developed and completely
            free and open source.
          </p>
        </section>

        {/* Who Should Use OpenFurqan */}
        <section className="info-section">
          <h2 className="info-section-title">Who Should Use OpenFurqan</h2>
          <ul className="info-audience-list">
            <li>Muslims who want to read the Quran online with a clean, distraction-free interface</li>
            <li>Students studying Quranic Arabic with word-by-word analysis and root dictionaries</li>
            <li>People memorizing the Quran (Hifz) with repetition loops and progress tracking</li>
            <li>Researchers studying Quran translations across multiple languages</li>
            <li>Anyone looking for a fast, modern Quran reading experience with study tools</li>
          </ul>
        </section>

        {/* Features */}
        <section className="info-section">
          <h2 className="info-section-title">Features</h2>
          <div className="info-feature-grid">
            <div className="info-feature-item">
              <h3 className="info-feature-title">22+ Translations</h3>
              <p className="info-feature-desc">
                English: Sahih International, Arberry, Pickthall, Yusuf Ali, Taqi Usmani, Haleem,
                Al-Hilali &amp; Khan, Maarif-ul-Quran, Maududi, Ahmed Raza. Bangla: Muhiuddin Khan,
                Zohurul Hoque, Mokhtasar, Ahsanul-Bayaan. Urdu: Kanz al-Iman, Bayan-ul-Quran. Plus
                Hindi, French, German, Spanish, and Sinhala translations.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">9+ Audio Reciters</h3>
              <p className="info-feature-desc">
                Mishary Rashid Alafasy, Abdurrahman As-Sudais, Saud Ash-Shuraym, Abu Bakr
                Ash-Shaatree, Maher Al-Muaiqly, Hani Rifai, Abdul Basit (Murattal), Mahmoud Khalil
                Al-Husary, and Mohamed Siddiq Al-Minshawi. Adjustable playback speed and continuous
                surah playback.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Word-by-Word Analysis</h3>
              <p className="info-feature-desc">
                Morphological breakdown of every Arabic word: root, lemma, part-of-speech, and
                individual word audio pronunciation. Click any word to explore its linguistic details.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">15+ Tajweed Rules</h3>
              <p className="info-feature-desc">
                Color-coded pronunciation rules: hamzat al-wasl, laam shamsiyah, laam qamariyah,
                madd (natural, permissible, obligatory, necessary), qalqalah, ikhfaa, iqlab, idgham
                (with and without ghunnah), ghunnah, and silent letters.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Study Mode</h3>
              <p className="info-feature-desc">
                Bookmarks, personal notes per ayah, customizable reading plans with daily ayah
                goals, reading statistics with current and longest streaks, and long-term reading history.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Hifz / Memorization</h3>
              <p className="info-feature-desc">
                Mark ayahs as memorized, set repetition loops, select ayah ranges for focused
                practice with audio, and track memorization progress across surahs.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">7+ Tafsir Editions</h3>
              <p className="info-feature-desc">
                Maarif-ul-Quran, Maududi, Ahsanul Bayaan, Mokhtasar, Al-Jalalayn, Kashf Al-Asrar,
                and Hindi Tafseer. Load Tafsir on-demand for any ayah.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Prayer Times</h3>
              <p className="info-feature-desc">
                Accurate prayer times for 31+ countries with 11+ calculation methods. Supports
                Hanafi and Shafi madhab. Configure your city and see the next prayer at a glance.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Arabic Root Lexicon</h3>
              <p className="info-feature-desc">
                Lane&#39;s Lexicon definitions for Arabic word roots, Buckwalter transliteration, and
                all Quran occurrences of each root word.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Reading Statistics</h3>
              <p className="info-feature-desc">
                Track daily verses read, minutes spent reading, current streak, longest streak, and
                long-term reading history automatically.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Study Tools</h3>
              <p className="info-feature-desc">
                The Tools tab includes: Memorize Mode, Show Translation, Show Transliteration,
                Dim Other Ayahs, Auto-scroll on Play, Tajweed Colors with color key legend,
                Word by Word mode, and Mushaf View for page-like reading. Customize Arabic and
                translation text size, playback speed, script (Uthmani or Naskh), Arabic font,
                and reciter — all from one panel.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">More Features</h3>
              <p className="info-feature-desc">
                4 visual themes (Dark, Parchment, Black &amp; White, Dark B&amp;W), Arabic and
                English search, full keyboard shortcuts, offline PWA support, customizable Arabic
                fonts (KFGQPC Hafs, Hafs Smart, Scheherazade New, Uthman Naskh), and adjustable
                text sizes.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="info-section">
          <h2 className="info-section-title">Data Sources</h2>
          <p className="info-text">
            All Quranic text, translations, audio recitations, and linguistic data used in OpenFurqan
            are sourced from well-established, widely trusted Islamic and academic datasets. Every
            piece of data has been carefully cross-checked, analyzed, and verified for accuracy before
            being included in the application.
          </p>
        </section>

        {/* Open Source */}
        <section className="info-section">
          <h2 className="info-section-title">Open Source</h2>
          <p className="info-text">
            OpenFurqan is open source. The project is independently developed and completely free.
            Contributions, feedback, and issue reports are welcome.
          </p>
        </section>

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href="/" className="seo-cta">
            Start Reading the Quran &rarr;
          </Link>
        </div>

        {/* Footer Nav */}
        <nav className="info-nav">
          <Link href="/">Home</Link>
          <Link href="/faq">FAQ</Link>
        </nav>

        <footer className="seo-footer">
          <p>
            <Link href="/">OpenFurqan</Link> — Read the Quran with translations, audio &amp; study
            tools.
          </p>
        </footer>
      </div>
    </div>
  );
}
