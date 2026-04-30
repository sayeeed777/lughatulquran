import Link from "next/link";
import type { Metadata } from "next";
import { getCspNonce } from "../lib/csp";

export const metadata: Metadata = {
  title: "About OpenFurqan — Free Open-Source Quran Reader with Study Tools & Memorization",
  description:
    "OpenFurqan is a free, open-source Quran reading web application with 20+ translations, 16 reciters, ayah image sharing, word-synced audio highlights, local Quran search, memorization, Tafsir, root lexicon, prayer times, and more.",
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "About OpenFurqan — Free Open-Source Quran Reader",
    description:
      "A free, open-source Quran reading web app with 16 reciters, ayah image sharing, Anki-style memorization, local Quran search, word-by-word analysis, Tajweed, Tafsir, and more.",
    url: "https://openfurqan.com/about",
    siteName: "OpenFurqan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "About OpenFurqan — Free Open-Source Quran Reader",
    description:
      "A free, open-source Quran reading web app with 16 reciters, ayah image sharing, Anki-style memorization, local Quran search, word-by-word analysis, Tajweed, Tafsir, and more."
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
      "OpenFurqan is a free, open-source Quran reading web application with translations, audio, local recitation notes, study tools, and more."
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
      "A free, open-source Quran reading web application with 20+ translations across 9+ languages, 16 audio reciters, local recitation notes, Surah/Juz/Page views, ayah image sharing, Anki-style spaced repetition memorization, word-by-word analysis, word-synced recitation highlights, local Quran search, Tajweed color-coding, Tafsir, prayer times, and study features.",
    featureList: [
      "20+ Quran translations in 9+ languages",
      "16 audio reciters with adjustable playback speed",
      "Word-synced audio highlighting for supported reciters",
      "Recitation notes with local WAV recording, replay, download, and delete",
      "Surah, Juz, and Page reading views",
      "Compare translations from each ayah card",
      "Share ayahs as generated images with background palettes and text-size controls",
      "Anki-style spaced repetition memorization (SRS) with flashcards",
      "Word-by-word meaning memorization cards",
      "Word-by-word Arabic analysis with root and morphology",
      "15+ color-coded Tajweed pronunciation rules",
      "Study Mode with bookmarks, notes, reading plans, search, and embedded memorization",
      "Hifz memorization mode with repetition loops",
      "7+ Tafsir editions",
      "Local Quran search by Arabic, translation, transliteration, word meaning, root, lemma, and surah name",
      "Prayer times for 31+ countries",
      "Arabic root lexicon with Lane's Lexicon definitions",
      "Reading statistics and streak tracking",
      "Reading progress persistence per surah, juz, and page",
      "6 visual themes with smooth transitions",
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
            Read, study, memorize, and listen — one free Quran app
          </p>
        </header>

        {/* What is OpenFurqan */}
        <section className="info-section">
          <h2 className="info-section-title">What is OpenFurqan</h2>
          <p className="info-text">
            OpenFurqan is a free, open-source web application for reading and deeply studying the
            Quran. It pairs a clean, distraction-free reader with a full-featured Study Mode — giving
            you 20+ translations, 16 audio reciters, local recitation notes, Surah/Juz/Page views,
            ayah image sharing, Anki-style spaced repetition memorization, word-by-word Arabic
            analysis, word-synced recitation highlights, local Quran search, Tajweed color-coding,
            7+ Tafsir editions, and daily reading statistics. No account, no ads, no payment — just
            open and read.
          </p>
        </section>

        {/* Why OpenFurqan Exists */}
        <section className="info-section">
          <h2 className="info-section-title">Why OpenFurqan Exists</h2>
          <p className="info-text">
            Most Quran websites do one thing: display Arabic text with a translation. If you want to
            study a word&#39;s root, you open another tab. If you want to memorize, you download a
            separate app. If you want Tafsir, that&#39;s yet another website.
          </p>
          <p className="info-text">
            OpenFurqan was built to end that tab-switching. Reading, studying, memorizing, and
            listening live in a single fast interface. Tap a word and see its root in Lane&#39;s
            Lexicon. Compare translations from the ayah card. Flip to Tafsir without losing your
            place. Review flashcards with spaced repetition. Share an ayah as a clean image. Track
            your streak across days and weeks. All in one place, all free, all without signing up.
          </p>
          <p className="info-text">
            The project is independently developed and will always remain free and open source.
          </p>
        </section>

        {/* What Makes OpenFurqan Different */}
        <section className="info-section">
          <h2 className="info-section-title">What Makes OpenFurqan Different</h2>
          <ul className="info-audience-list">
            <li><strong>No login required.</strong> Your notes, progress, and recitation recordings stay on your device and are not uploaded to our servers.</li>
            <li><strong>No ads, ever.</strong> No banners, no pop-ups, no sponsored content.</li>
            <li><strong>Reader + study in one place.</strong> Switch between a simple reader and a deep study workspace without leaving the app.</li>
            <li><strong>Compare without leaving the ayah.</strong> Use the compare icon to review translations and continue into Tafsir from the same reading flow.</li>
            <li><strong>Share ayahs beautifully.</strong> Generate ayah images with background palettes, Arabic and English text-size controls, save, and native share.</li>
            <li><strong>Recitation notes built in.</strong> Record your own recitation, replay it, download it, or delete it from the Notes rail.</li>
            <li><strong>Memorize with spaced repetition.</strong> Anki-style flashcards that schedule reviews based on your recall — not just audio loops.</li>
            <li><strong>Word-level Arabic study.</strong> Click any word to see its meaning, root, morphology, Lane&#39;s Lexicon definition, word audio, and every occurrence in the Quran.</li>
            <li><strong>Powerful Quran search.</strong> Search Arabic text, translation, transliteration, word meanings, roots, lemmas, and surah names.</li>
            <li><strong>Three reading views.</strong> Read by Surah, by Juz (all 30), or by Mushaf page (all 604 pages).</li>
            <li><strong>Fast and installable.</strong> Works offline as a Progressive Web App. Install it on your phone like a native app.</li>
          </ul>
        </section>

        {/* Who Should Use OpenFurqan */}
        <section className="info-section">
          <h2 className="info-section-title">Who Should Use OpenFurqan</h2>
          <ul className="info-audience-list">
            <li>Muslims who want a clean, distraction-free Quran reading experience online</li>
            <li>Students learning Quranic Arabic through word-by-word analysis and root dictionaries</li>
            <li>Anyone memorizing the Quran (Hifz) — with spaced repetition flashcards or audio repetition loops</li>
            <li>Readers who prefer Juz or Page-based reading alongside traditional Surah view</li>
            <li>Researchers comparing Quran translations across multiple languages</li>
            <li>Creators who want to share Quran ayahs as polished images with canonical ayah links</li>
            <li>Teachers looking for a free tool to share with students — no accounts to manage</li>
          </ul>
        </section>

        {/* Features */}
        <section className="info-section">
          <h2 className="info-section-title">Features</h2>
          <div className="info-feature-grid">
            <div className="info-feature-item">
              <h3 className="info-feature-title">20+ Translations</h3>
              <p className="info-feature-desc">
                English: Sahih International, Arberry, Pickthall, Yusuf Ali, Taqi Usmani, Haleem,
                Al-Hilali &amp; Khan, Maarif-ul-Quran, Ahmed Raza. Bangla: Muhiuddin Khan,
                Zohurul Hoque. Urdu: Kanz al-Iman, Bayan-ul-Quran. Plus Hindi, Turkish, French,
                German, Spanish, and Sinhala. Show multiple translations side by side or open the
                compare panel from any ayah card.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Translation Compare</h3>
              <p className="info-feature-desc">
                Use the compare icon on a reader ayah card to review available translations for that
                verse, then continue into Tafsir when you want deeper commentary.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">16 Audio Reciters</h3>
              <p className="info-feature-desc">
                Alafasy, As-Sudais, Ash-Shuraym, Ash-Shaatree, Al-Muaiqly, Hani Rifai, Abdul Basit
                (Murattal &amp; Mujawwad), Al-Husary (Standard &amp; Muallim), Al-Minshawi,
                Al-Ghamdi, al-Ajmy, Ali Jabir, Al Tunaiji, and Ad-Dussary. Adjustable playback speed
                and continuous surah playback. Supported reciters include word-synced Arabic
                highlighting during playback.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Recitation Notes</h3>
              <p className="info-feature-desc">
                Record your own recitation in the Notes rail, preview it with a custom player, and
                save it for replay, download, or deletion later. Your recordings stay on your device
                and are not uploaded to our servers. Microphone permission is requested only when you
                choose to record.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Surah, Juz &amp; Page Views</h3>
              <p className="info-feature-desc">
                Read by Surah (chapter), Juz (para — all 30), or Mushaf Page (all 604). Switch
                between views instantly. Juz and Page support swipe navigation on mobile.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Anki-Style Memorization</h3>
              <p className="info-feature-desc">
                Spaced repetition flashcards for long-term Quran memorization. See an ayah, rate your
                recall (Again / Hard / Good / Easy), and the algorithm schedules the next review.
                Audio autoplay, session stats, streak tracking, word-by-word meaning cards, embedded
                Study Mode access, and session sharing included.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Hifz Repetition Mode</h3>
              <p className="info-feature-desc">
                Select an ayah range, set repetition loops, and practice with audio. Mark ayahs as
                memorized and track progress across surahs. Complements the SRS flashcards for
                audio-based drilling.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Word-by-Word &amp; Lexicon</h3>
              <p className="info-feature-desc">
                Morphological breakdown of every word: root, lemma, part-of-speech, and individual
                word audio. Tap any word to open Word Details, then continue into Root Details and
                Lane&#39;s Lexicon with definitions, Buckwalter transliteration, forms, statistics, and
                Quran occurrences of that root.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">15+ Tajweed Rules</h3>
              <p className="info-feature-desc">
                Color-coded pronunciation rules including ikhfaa, idgham, ghunnah, qalqalah, four
                types of madd, hamzat al-wasl, laam shamsiyah/qamariyah, iqlab, and silent letters.
                A legend shows what each color means.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">7+ Tafsir Editions</h3>
              <p className="info-feature-desc">
                Maarif-ul-Quran, Maududi, Ahsanul Bayaan, Mokhtasar, Al-Jalalayn, Kashf Al-Asrar,
                and Hindi Tafseer. Load Tafsir for any ayah on demand without leaving your reading
                or use the compare flow to move from translation comparison into commentary.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Study Mode</h3>
              <p className="info-feature-desc">
                Bookmarks, personal notes per ayah, customizable reading plans with daily goals,
                reading statistics with streaks, embedded memorization, local Quran search, and
                long-term reading history — all in one workspace.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Local Quran Search</h3>
              <p className="info-feature-desc">
                Search Arabic text, translation, transliteration, word meanings, roots, lemmas, and
                surah names. Root-match results can open Root Details directly for deeper study.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Share Ayahs as Images</h3>
              <p className="info-feature-desc">
                Generate a clean ayah image with Arabic, translation, surah reference, background
                palettes, and Arabic/English text-size controls. Save the image or share it from
                your device. Text sharing uses canonical ayah links like /surah/yusuf/53.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Reading Progress</h3>
              <p className="info-feature-desc">
                Your position is saved per surah, juz, and page — you always resume where you left
                off. Track daily verses, time spent, current streak, and longest streak automatically.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Prayer Times</h3>
              <p className="info-feature-desc">
                Accurate prayer times for 31+ countries with 11+ calculation methods. Hanafi and Shafi
                madhab support. See the next prayer at a glance.
              </p>
            </div>
            <div className="info-feature-item">
              <h3 className="info-feature-title">Customization</h3>
              <p className="info-feature-desc">
                6 themes (Dark, Parchment, Black &amp; White, Dark B&amp;W, Mist, and Sky), 4 Arabic fonts including
                Scheherazade New as the default, Uthmani or Naskh script, adjustable text sizes,
                full keyboard shortcuts, and offline PWA support.
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

        {/* Privacy */}
        <section className="info-section">
          <h2 className="info-section-title">Privacy</h2>
          <p className="info-text">
            OpenFurqan does not collect personal data. There are no accounts, no tracking pixels, and
            no analytics cookies. Your bookmarks, notes, recitation recordings, reading progress, and
            memorization data stay on your device and are not uploaded to our servers. Microphone
            permission is requested only when you choose to record a recitation note. If you clear
            your browser data, your saved data may be removed — because it was never stored anywhere
            else.
          </p>
        </section>

        {/* Open Source */}
        <section className="info-section">
          <h2 className="info-section-title">Open Source</h2>
          <p className="info-text">
            OpenFurqan is open source and independently developed. The project is completely free and
            will remain so. Contributions, feedback, and issue reports are welcome from the community.
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
