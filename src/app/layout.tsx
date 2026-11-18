import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Newsreader } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const book = Newsreader({
  variable: "--font-book",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Skill Press",
  description: "The most-installed AI agent skills, typeset and bound as books you can page through.",
};

export const viewport: Viewport = {
  themeColor: "#ebe8df",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${book.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
