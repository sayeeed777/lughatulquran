import Link from "next/link";
import type { Metadata } from "next";
import { getCspNonce } from "../lib/csp";

const FAQ_ITEMS = [
  // General
  {
    category: "General",
    question: "What is OpenFurqan?",
    answer:
      "OpenFurqan is a free web app for reading, studying, memorizing, and listening to the Quran. It combines a clean reader with a deep Study Mode — 20+ translations, 16 reciters, Surah/Juz/Page views, Anki-style spaced repetition memorization, word-by-word Arabic analysis, Tajweed colors, 7+ Tafsir editions, and reading statistics. No account, no ads, no payment."
  },
  {
    question: "Is OpenFurqan free?",
    answer:
      "Yes, completely. No ads, no subscription, no account required. The project is independently developed, open source, and will always be free."
  },
  {
    question: "Can I read the Quran without signing in?",
    answer:
      "Yes. OpenFurqan requires no account, no login, and no sign-up. Just open openfurqan.com and start reading. Your notes, progress, and recitation recordings stay on your device and are not uploaded to our servers."
  },
  {
    question: "Is OpenFurqan a good alternative to Quran.com?",
    answer:
      "OpenFurqan is not intended to replace Quran.com. It offers a different philosophy: integrated study tools, Anki-style memorization, Tajweed visualization, word-by-word root analysis, Surah/Juz/Page views, and deep customization in a single interface. Both are free resources for reading the Quran online."
  },
  // Reading & Translations
  {
    category: "Reading & Translations",
    question: "How do I read the Quran on OpenFurqan?",
    answer:
      "Visit openfurqan.com, select a surah from the sidebar list or search by name or number. The Arabic text appears with your selected translation below each ayah. You can navigate between ayahs using arrow keys, J/K keys, or by scrolling. In Study Mode, switch between Surah, Juz, and Page views for different reading experiences."
  },
  {
    question: "What are the Surah, Juz, and Page views?",
    answer:
      "Study Mode offers three reading scopes: Surah view (read one surah at a time), Juz view (read by juz/para with navigation between all 30 juz), and Page view (read by mushaf page with navigation across all 604 pages). Switch between them from the Study tab in the study panel. Juz and Page views support swipe navigation on mobile."
  },
  {
    question: "How do I change or add translations?",
    answer:
      "Click the Settings gear icon in the topbar, go to the Display tab, and select translation chips to enable or disable them. Multiple translations can be shown side by side. 20+ translations are available across English, Bangla, Urdu, Hindi, Turkish, French, German, Spanish, and Sinhala."
  },
  {
    question: "Which translations are available?",
    answer:
      "English: Sahih International, Arberry, Pickthall, Yusuf Ali, Taqi Usmani, Haleem, Al-Hilali & Khan, Maarif-ul-Quran, Ahmed Raza. Bangla: Muhiuddin Khan, Zohurul Hoque. Urdu: Kanz al-Iman, Bayan-ul-Quran. Plus Hindi, Turkish, French, German, Spanish, and Sinhala translations."
  },
  {
    question: "Which Bangla and Urdu translations are available?",
    answer:
      "Bangla: Muhiuddin Khan and Zohurul Hoque. Urdu: Kanz al-Iman and Bayan-ul-Quran. Select them from the Settings panel under the Display tab. You can show multiple translations at the same time."
  },
  // Audio
  {
    category: "Audio",
    question: "How do I listen to audio recitation?",
    answer:
      "Click the play button on any ayah or press P or Space on your keyboard. Audio plays continuously through the surah. To change the reciter, open Settings, go to the Audio tab, and select from 16 reciters. Playback speed is adjustable from the Tools tab in Study Mode."
  },
  {
    question: "Which reciters are available?",
    answer:
      "Mishary Rashid Alafasy, Abdurrahman As-Sudais, Saud Ash-Shuraym, Abu Bakr Ash-Shaatree, Maher Al-Muaiqly, Hani Rifai, Abdul Basit (Murattal), Abdul Basit (Mujawwad), Mahmoud Khalil Al-Husary, Al-Husary (Muallim), Mohamed Siddiq Al-Minshawi, Saad Al-Ghamdi, Ahmed ibn Ali al-Ajmy, Abdullah Ali Jabir, Khalifah Al Tunaiji, and Yasser Ad-Dussary."
  },
  {
    question: "Can I listen to Quran recitation with translation?",
    answer:
      "Yes. Enable a translation from Settings, then play any ayah. The audio recitation plays while the Arabic text and your selected translation are both visible on screen. You can show multiple translations side by side while listening."
  },
  {
    question: "Can I record and save my own recitation?",
    answer:
      "Yes. In Study Mode, open the Notes tab and use Recitation Notes to record your own recitation, preview it, save it, replay it, download it, or delete it later. Your recitation recordings stay on your device and are not uploaded to our servers. Microphone permission is requested only when you tap Start recording."
  },
  // Memorization
  {
    category: "Memorization",
    question: "How does the Anki-style memorization work?",
    answer:
      "OpenFurqan includes a full spaced repetition system (SRS) inspired by Anki. You review flashcards of Quran ayahs and rate your recall as Again, Hard, Good, or Easy. The system schedules each card based on your performance — cards you struggle with appear more frequently, while mastered cards appear less often. This scientifically-proven method optimizes long-term memorization."
  },
  {
    question: "How do I start a memorization session?",
    answer:
      "Click the Memorization tab in the study rail or navigate to the Memorization page. Choose your scope (Surah or Juz), select the specific surah or juz number, and start your session. Cards show the Arabic text and you can reveal the translation to check your understanding before rating your recall."
  },
  {
    question: "What do the memorization card ratings mean?",
    answer:
      "Again: You forgot the ayah completely — it will be shown again soon. Hard: You remembered with difficulty — shorter interval. Good: You remembered correctly — normal interval increase. Easy: You remembered effortlessly — longer interval. The SRS algorithm adjusts review intervals based on your ratings to optimize retention."
  },
  {
    question: "Does memorization have audio autoplay?",
    answer:
      "Yes. When a memorization card appears, the audio recitation plays automatically so you can hear the ayah as you study. You can mute/unmute this feature using the speaker icon in the session header."
  },
  {
    question: "Can I share my memorization results?",
    answer:
      "Yes. After completing a memorization session, a share button appears showing your scope, cards reviewed, accuracy percentage, time spent, and streak. It uses your device's native share feature or copies to clipboard."
  },
  {
    question: "Can I use OpenFurqan for Hifz?",
    answer:
      "Yes. OpenFurqan offers two memorization methods: Anki-style spaced repetition flashcards that schedule reviews based on your recall, and a Hifz repetition mode where you select an ayah range, set loop count, and practice with audio. Both track your progress across surahs."
  },
  // Study & Learning
  {
    category: "Study & Learning",
    question: "Does OpenFurqan have Tafsir?",
    answer:
      "Yes. OpenFurqan includes 7+ Tafsir editions: Maarif-ul-Quran, Maududi, Ahsanul Bayaan, Mokhtasar, Al-Jalalayn, Kashf Al-Asrar, and Hindi Tafseer. Open the Tafsir tab in Study Mode to load commentary for any ayah on demand."
  },
  {
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
      "Click the Study Mode button in the topbar or press F on your keyboard. This opens the study panel with tabs for Study (bookmarks, notes, reading plan), Tools (reading aids, typography, audio settings), Tafsir, Search, Hifz, and Notes. You can read in Surah, Juz, or Page view."
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
    question: "How do I use the advanced search in Study Mode?",
    answer:
      "Open the Search tab in the study panel. The search home screen shows recent searches, key verses (Ayat al-Kursi, Al-Fatiha, Light Verse, etc.) for quick navigation, topic groups organized by category (Core Themes, Worship, Life & Society, Hereafter), and search tips. Type to search by Arabic text or translation, and click any result to jump directly to that ayah."
  },
  // Study Tools Tab
  {
    category: "Study Tools",
    question: "What options are available in the Tools tab?",
    answer:
      "The Tools tab in Study Mode includes: Memorize Mode (mark ayahs as you memorize), Show Translation (keep translation visible under each ayah), Show Transliteration (display transliteration in Study Mode), Dim Other Ayahs (highlight the focused ayah), Auto-scroll on Play (follow recitation as ayahs advance), Tajweed Colors (show color-coded pronunciation highlights with a legend), Word by Word (enable word chips and word-level audio), and Mushaf View (cleaner page-like reading layout). It also has sliders for Arabic text size, translation text size, and playback speed. You can choose between Uthmani and Naskh script, select your Arabic font, and pick your preferred reciter from 16 options."
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
  // Prayer & Settings
  {
    category: "Prayer & Settings",
    question: "How do I check prayer times?",
    answer:
      "Click the prayer times icon (clock) in the topbar. Set your country and city in Settings, go to the Prayer tab. Choose your calculation method and madhab (Hanafi or Shafi). 31+ countries and 11+ calculation methods are supported. The next prayer time is shown at a glance."
  },
  {
    question: "How do I change the theme?",
    answer:
      "Click the theme switcher icon in the topbar. Choose from 4 themes: Dark (default dark background), Parchment (warm light background), Black & White (pure contrast), or Dark B&W (true black background). Theme changes animate smoothly between colors."
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
  // Technical
  {
    category: "Technical",
    question: "How do I search the Quran?",
    answer:
      "Press / on your keyboard or click the search icon. Search by Arabic text or English translation. Results show matching ayahs with the surah name and ayah number. Click any result to jump to that verse. In Study Mode, the search panel also offers key verses, topic exploration, and recent search history."
  },
  {
    question: "Does OpenFurqan work offline?",
    answer:
      "Yes. OpenFurqan is a Progressive Web App (PWA). After your first visit, the app shell and previously viewed content are cached for offline use. You can also install it on your device for quick access."
  },
  {
    question: "Does OpenFurqan save my reading progress?",
    answer:
      "Yes. Reading position is automatically saved per surah, juz, and page. When you return, you resume exactly where you left off. Reading statistics are also tracked automatically: daily verses read, minutes spent reading, current streak, longest streak, and long-term reading history."
  },
  {
    question: "How can I report issues or contribute?",
    answer:
      "OpenFurqan is open source and welcomes community contributions. You can report issues, suggest features, or contribute to the project."
  },
  // Privacy & Data
  {
    category: "Privacy & Data",
    question: "Where is my data stored?",
    answer:
      "All your data — bookmarks, notes, recitation recordings, reading progress, memorization history, and preferences — stays on your device and is not uploaded to our servers."
  },
  {
    question: "Does OpenFurqan collect personal data?",
    answer:
      "No. OpenFurqan does not collect any personal data. There are no accounts, no tracking pixels, no analytics cookies, and no third-party data collection. The app works entirely on your device."
  },
  {
    question: "Do bookmarks and notes stay on my device?",
    answer:
      "Yes. Bookmarks, notes, recitation recordings, and other saved data stay on your device and are not uploaded to our servers. If you clear your browser data, your saved content may be removed because it was never stored anywhere else."
  },
  {
    question: "Where does OpenFurqan get its Quran text and translations?",
    answer:
      "All Quranic text, translations, audio recitations, and linguistic data are sourced from well-established, widely trusted Islamic and academic datasets. Every piece of data has been carefully cross-checked, analyzed, and verified for accuracy before being included."
  }
];

export const metadata: Metadata = {
  title: "FAQ — OpenFurqan Quran Reader | How to Use Every Feature",
  description:
    "Frequently asked questions about OpenFurqan. Learn how to use translations, 16 audio reciters, recitation notes, word-by-word analysis, Tajweed, Study Mode with Surah/Juz/Page views, Anki-style memorization, Tafsir, prayer times, and more.",
  alternates: {
    canonical: "/faq"
  },
  openGraph: {
    title: "FAQ — OpenFurqan Quran Reader",
    description:
      "Learn how to use every feature of OpenFurqan: translations, 16 reciters, recitation notes, word-by-word, Tajweed, Surah/Juz/Page views, Anki-style memorization, Tafsir, prayer times, and more.",
    url: "https://openfurqan.com/faq",
    siteName: "OpenFurqan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — OpenFurqan Quran Reader",
    description:
      "Learn how to use every feature of OpenFurqan: translations, 16 reciters, recitation notes, word-by-word, Tajweed, Surah/Juz/Page views, Anki-style memorization, Tafsir, prayer times, and more."
  }
};

export default async function FaqPage() {
  const nonce = await getCspNonce();

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

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href="/" className="seo-cta">
            Start Reading the Quran &rarr;
          </Link>
        </div>

        {/* Footer Nav */}
        <nav className="info-nav">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
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
