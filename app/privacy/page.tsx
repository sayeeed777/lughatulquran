import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenFurqan for Android",
  description:
    "How the OpenFurqan app for Android handles your data: no accounts, no ads, no tracking. Your bookmarks, notes, recordings, and progress stay on your phone.",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "Privacy Policy — OpenFurqan for Android",
    description:
      "No accounts, no ads, no tracking. Your bookmarks, notes, recordings, and progress stay on your phone.",
    url: "https://openfurqan.com/privacy",
    siteName: "OpenFurqan",
    type: "website"
  }
};

const CONTACT = "openfurqan@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="seo-page">
      <div className="seo-container">
        <header className="seo-header">
          <h1 className="seo-english-title">Privacy Policy</h1>
          <p className="seo-translation">
            For the OpenFurqan app on Android (com.openfurqan.app). Last updated 27 September 2026.
          </p>
        </header>

        <section className="info-section">
          <h2 className="info-section-title">In short</h2>
          <p className="info-text">
            OpenFurqan does not collect, store, or share your personal data. There are no accounts,
            no ads, no analytics, and no tracking of any kind. Everything you create in the app stays
            on your phone.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">What stays on your phone</h2>
          <p className="info-text">
            Your bookmarks, notes, voice recordings, reading progress, practice progress, and
            settings are saved only on your phone. We have no server that receives them and no way
            to see them. Uninstalling the app, or clearing its storage, removes them.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Microphone</h2>
          <p className="info-text">
            The app asks for microphone access only when you choose to record a voice note or a
            recitation. Recordings are saved on your phone and are never uploaded. You can refuse or
            withdraw this permission at any time in your phone&#39;s settings; everything else in
            the app keeps working.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Content the app downloads</h2>
          <p className="info-text">
            The Quran text, the main translations, and most study material are built into the
            app. Some content is downloaded when you use it:
          </p>
          <ul className="info-audience-list">
            <li>
              Recitation audio, from EveryAyah (everyayah.com), when you play or download a
              recitation.
            </li>
            <li>
              Word pronunciation audio, from Quran.com&#39;s audio service (audio.qurancdn.com),
              when you play a word.
            </li>
            <li>
              Tafsirs and further translations, from OpenFurqan&#39;s own data server
              (data.openfurqan.com, hosted by Cloudflare), when you open one that is not built in.
            </li>
          </ul>
          <p className="info-text">
            These requests carry no account or personal details, only what any download needs. As
            with any website, these services receive your phone&#39;s IP address and the file
            requested, and handle it under their own privacy policies. Downloaded audio, tafsirs,
            and translations are kept on your phone for offline use.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Backups and sharing</h2>
          <p className="info-text">
            The app never sends your data anywhere by itself. On Android 10 and later it keeps an
            up-to-date backup file on your phone, in Download/OpenFurqan, so your data survives
            reinstalling the app. It stays on your phone, where other apps you allow to read your
            files could see it, and you can delete it at any time.
          </p>
          <p className="info-text">
            When you choose to send a copy of your data, you decide where it goes. When you share an
            ayah as text or an image, it goes only to the app you pick.
          </p>
          <p className="info-text">
            The app is excluded from Google&#39;s cloud backup. When you move to a new phone with
            Android&#39;s phone-to-phone transfer, your app data can be copied directly to the new
            phone.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Notifications</h2>
          <p className="info-text">
            While a recitation plays, the app shows a playback control in your notifications and on
            the lock screen. It sends no other notifications.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Children</h2>
          <p className="info-text">
            OpenFurqan collects no personal data from anyone, including children.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Changes to this policy</h2>
          <p className="info-text">
            If this policy changes, the new version will be posted on this page with a new date.
          </p>
        </section>

        <section className="info-section">
          <h2 className="info-section-title">Contact</h2>
          <p className="info-text">
            Questions about privacy in OpenFurqan: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </p>
        </section>

        <nav className="info-nav">
          <Link href="/">Home</Link>
        </nav>
      </div>
    </div>
  );
}
