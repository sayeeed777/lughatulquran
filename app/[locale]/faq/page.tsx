import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCspNonce } from "../../lib/csp";
import {
  isSupportedLocale,
  withLocalePath,
  localeAlternateMap,
  SUPPORTED_LOCALES
} from "../../lib/locales";

const FAQ_ITEMS = [
  {
    category: "General",
    question: "What is OpenFurqan?",
    answer:
      "OpenFurqan is a free, open-source Quran reading web application built around two focused experiences: distraction-free reading with clean Arabic text and 22+ translations across 7+ languages, and a deep Study Mode with word-by-word analysis, Arabic root dictionary, Tajweed color-coding, Tafsir from 7+ editions, Hifz memorization tools, bookmarks, personal notes, reading plans, and progress tracking. Audio recitation is available from 9+ well-known reciters. No account, no ads, no payment required."
  },
  {
    question: "Is OpenFurqan free?",
    answer:
      "Yes, OpenFurqan is completely free and open source. There are no ads, no account required, and no payment needed. The project is independently developed and maintained."
  },
  {
    question: "Is OpenFurqan a good alternative to Quran.com?",
    answer:
      "OpenFurqan is not intended to replace Quran.com. It offers a different design philosophy focused on integrated study tools, memorization support, Tajweed visualization, word-by-word root analysis, and deep customization. Both are free resources for reading the Quran online."
  },
  {
    category: "Reading & Translations",
    question: "How do I read the Quran on OpenFurqan?",
    answer:
      "Visit openfurqan.com, select a surah from the sidebar list or search by name or number. The Arabic text appears with your selected translation below each ayah. You can navigate between ayahs using arrow keys, J/K keys, or by scrolling."
  },
  {
    question: "How do I change or add translations?",
    answer:
      "Click the Settings gear icon in the topbar, go to the Display tab, and select translation chips to enable or disable them. Multiple translations can be shown side by side. 22+ translations are available across English, Bangla, Urdu, Hindi, French, German, Spanish, and Sinhala."
  },
  {
    question: "Which translations are available?",
    answer:
      "English: Sahih International, Arberry, Pickthall, Yusuf Ali, Taqi Usmani, Haleem, Al-Hilali & Khan, Maarif-ul-Quran, Maududi, Ahmed Raza. Bangla: Muhiuddin Khan, Zohurul Hoque, Mokhtasar, Ahsanul-Bayaan. Urdu: Kanz al-Iman, Bayan-ul-Quran. Plus Hindi, French, German, Spanish, and Sinhala translations."
  },
  {
    category: "Audio",
    question: "How do I listen to audio recitation?",
    answer:
      "Click the play button on any ayah or press P or Space on your keyboard. Audio plays continuously through the surah. To change the reciter, open Settings, go to the Audio tab, and select from 9+ reciters. Playback speed is adjustable from the Tools tab in Study Mode."
  },
  {
    question: "Which reciters are available?",
    answer:
      "Mishary Rashid Alafasy, Abdurrahman As-Sudais, Saud Ash-Shuraym, Abu Bakr Ash-Shaatree, Maher Al-Muaiqly, Hani Rifai, Abdul Basit (Murattal), Mahmoud Khalil Al-Husary, and Mohamed Siddiq Al-Minshawi."
  },
  {
    category: "Study & Learning",
    question: "How do I use word-by-word mode?",
    answer:
      "Press W on your keyboard or enable Word by Word from the Tools tab in Study Mode. Each Arabic word shows its individual meaning. Click any word to see its root, lemma, part-of-speech, and hear its pronunciation."
  },
  {
    question: "How do I enable Tajweed colors?",
    answer:
      "Toggle Tajweed Colors from the Tools tab in Study Mode. 15+ pronunciation rules are color-coded including ikhfaa, idgham, ghunnah, qalqalah, madd (4 types), and more. When enabled, a Tajweed Color Key legend appears showing what each color means."
  },
  {
    question: "How do I use Study Mode?",
    answer:
      "Click the Study Mode button in the topbar or press F on your keyboard. This opens the study panel with tabs for Study (bookmarks, notes, reading plan), Tools (reading aids, typography, audio settings), Tafsir, Search, and Notes."
  },
  {
    question: "How do I bookmark ayahs?",
    answer:
      "In Study Mode, click the bookmark icon on any ayah. Access all your bookmarks from the Study tab in the study panel. Bookmarks are sorted and persist in your browser."
  },
  {
    question: "How do I take notes on ayahs?",
    answer:
      "In Study Mode, click the notes icon on any ayah to write personal notes. Notes auto-save and persist locally in your browser. You can also access all your notes from the Notes tab in the study panel."
  },
  {
    question: "How do I create a reading plan?",
    answer:
      "In the Study tab of the study panel, configure your reading plan: set a start surah, start ayah, ayahs per day, and start date. The plan shows your daily reading target, tracks your progress, and lets you jump directly to today's assigned reading."
  },
  {
    question: "How do I use Hifz / Memorization mode?",
    answer:
      "Enable Memorize Mode from the Tools tab in Study Mode. Select an ayah range for focused memorization, set repetition loops, and use audio playback for practice. Mark ayahs as memorized to track your progress across surahs. A memorization guide appears when the mode is enabled."
  },
  {
    question: "How do I read Tafsir?",
    answer:
      "Open the Tafsir tab in the study panel while viewing any ayah. Choose from 7+ editions: Maarif-ul-Quran, Maududi, Ahsanul Bayaan, Mokhtasar, Al-Jalalayn, Kashf Al-Asrar, and Hindi Tafseer. Tafsir loads on-demand for the current ayah."
  },
  {
    question: "How do I use the Lexicon?",
    answer:
      "Click the Study Mode button to enter Study Mode. In the study page, click on any Arabic word in an ayah card. The lexicon opens showing the word's root, Lane's Lexicon definitions, Buckwalter transliteration, and all Quran occurrences of that root."
  },
  {
    category: "Study Tools",
    question: "What options are available in the Tools tab?",
    answer:
      "The Tools tab in Study Mode includes: Memorize Mode (mark ayahs as you memorize), Show Translation (keep translation visible under each ayah), Show Transliteration (display transliteration in Study Mode), Dim Other Ayahs (highlight the focused ayah), Auto-scroll on Play (follow recitation as ayahs advance), Tajweed Colors (show color-coded pronunciation highlights with a legend), Word by Word (enable word chips and word-level audio), and Mushaf View (cleaner page-like reading layout). It also has sliders for Arabic text size, translation text size, and playback speed. You can choose between Uthmani and Naskh script, select your Arabic font, and pick your preferred reciter."
  },
  {
    question: "What is Mushaf View?",
    answer:
      "Mushaf View provides a cleaner, page-like reading layout that resembles a traditional printed Quran (mushaf). Enable it from the Tools tab in Study Mode for a focused reading experience."
  },
  {
    question: "What does Dim Other Ayahs do?",
    answer:
      "When enabled from the Tools tab, Dim Other Ayahs highlights the currently focused ayah while dimming surrounding ayahs. This helps you concentrate on one verse at a time during study or recitation."
  },
  {
    question: "What does Auto-scroll on Play do?",
    answer:
      "When enabled from the Tools tab, the page automatically scrolls to follow the audio recitation as it advances through the ayahs, so you can read along without manually scrolling."
  },
  {
    category: "Prayer & Settings",
    question: "How do I check prayer times?",
    answer:
      "Click the prayer times icon (clock) in the topbar. Set your country and city in Settings, go to the Prayer tab. Choose your calculation method and madhab (Hanafi or Shafi). 31+ countries and 11+ calculation methods are supported. The next prayer time is shown at a glance."
  },
  {
    question: "How do I change the theme?",
    answer:
      "Click the theme switcher icon in the topbar. Choose from 4 themes: Dark (default dark background), Parchment (warm light background), Black & White (pure contrast), or Dark B&W (true black background)."
  },
  {
    question: "How do I customize text size and fonts?",
    answer:
      "Open the Tools tab in Study Mode. Adjust Arabic text size and translation text size with sliders. Choose from 4 Arabic fonts: KFGQPC Hafs, KFGQPC Hafs Smart, Scheherazade New, and Uthman Naskh. You can also switch between Uthmani and Naskh script styles."
  },
  {
    question: "What keyboard shortcuts are available?",
    answer:
      "Press ? to see all shortcuts. J/K or arrow keys for next/previous ayah, P or Space for play/pause audio, W for word-by-word mode, F for study/focus mode, / to open search, and Esc to close dialogs or modals."
  },
  {
    category: "Technical",
    question: "How do I search the Quran?",
    answer:
      "Press / on your keyboard or click the search icon. Search by Arabic text or English translation. Results show matching ayahs with the surah name and ayah number. Click any result to jump to that verse."
  },
  {
    question: "Does OpenFurqan work offline?",
    answer:
      "Yes. OpenFurqan is a Progressive Web App (PWA). After your first visit, the app shell and previously viewed content are cached for offline use. You can also install it on your device for quick access."
  },
  {
    question: "How do I track my reading progress?",
    answer:
      "Reading statistics are tracked automatically in the Study panel: daily verses read, minutes spent reading, current streak, longest streak, and long-term reading history. No setup is required."
  },
  {
    question: "How can I report issues or contribute?",
    answer:
      "Visit the OpenFurqan GitHub repository to report issues, suggest features, or contribute to the project. OpenFurqan is open source and welcomes community contributions."
  }
];

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const canonicalPath = withLocalePath(locale, "/faq");

  return {
    title: "FAQ — OpenFurqan Quran Reader | How to Use Every Feature",
    description:
      "Frequently asked questions about OpenFurqan. Learn how to use translations, audio recitation, word-by-word analysis, Tajweed, Study Mode, Hifz memorization, Tafsir, prayer times, and more.",
    alternates: {
      canonical: canonicalPath,
      languages: localeAlternateMap("/faq")
    },
    openGraph: {
      title: "FAQ — OpenFurqan Quran Reader",
      description:
        "Learn how to use every feature of OpenFurqan: translations, audio, word-by-word, Tajweed, Study Mode, Hifz, Tafsir, prayer times, and more.",
      url: `https://openfurqan.com${canonicalPath}`,
      siteName: "OpenFurqan",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: "FAQ — OpenFurqan Quran Reader",
      description:
        "Learn how to use every feature of OpenFurqan: translations, audio, word-by-word, Tajweed, Study Mode, Hifz, Tafsir, prayer times, and more."
    }
  };
}

export default async function LocaleFaqPage({ params }: Props) {
  const nonce = await getCspNonce();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const localizedPath = (path: string) => withLocalePath(locale, path);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  let currentCategory = "";

  return (
    <div className="seo-page">
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="seo-container">
        <header className="seo-header">
          <h1 className="seo-english-title">Frequently Asked Questions</h1>
          <p className="seo-translation">
            How to use every feature of OpenFurqan
          </p>
        </header>

        <section className="info-section">
          {FAQ_ITEMS.map((item, i) => {
            const showCategory = item.category && item.category !== currentCategory;
            if (item.category) currentCategory = item.category;
            return (
              <div key={i}>
                {showCategory && (
                  <h2 className="faq-category">{item.category}</h2>
                )}
                <details className="faq-item">
                  <summary className="faq-question">
                    <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {item.question}
                  </summary>
                  <p className="faq-answer">{item.answer}</p>
                </details>
              </div>
            );
          })}
        </section>

        <div className="seo-cta-section">
          <Link href={localizedPath("/")} className="seo-cta">
            Start Reading the Quran &rarr;
          </Link>
        </div>

        <nav className="info-nav">
          <Link href={localizedPath("/")}>Home</Link>
          <Link href={localizedPath("/about")}>About</Link>
        </nav>

        <footer className="seo-footer">
          <p>
            <Link href={localizedPath("/")}>OpenFurqan</Link> — Read the Quran with translations,
            audio &amp; study tools.
          </p>
        </footer>
      </div>
    </div>
  );
}
