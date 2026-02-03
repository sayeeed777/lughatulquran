import "./globals.css";
import { Fraunces, Manrope } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display"
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata = {
  title: "Quran Reader",
  description:
    "A modern Quran reader with authentic English translations (Arberry, Pickthall, Taqi Usmani, Yusuf Ali, Sahih International)."
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
