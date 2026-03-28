import type { Metadata } from "next";
import MemorizationApp from "../components/memorization/MemorizationApp";

export const metadata: Metadata = {
  title: "Quran Memorization | OpenFurqan",
  description: "Card-based Quran memorization with Abdel Haleem meaning, spaced repetition, and deck-based practice by surah, juz, or page."
};

export default function MemorizationPage() {
  return <MemorizationApp />;
}
