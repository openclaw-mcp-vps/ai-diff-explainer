import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-diff-explainer.com"),
  title: "AI Diff Explainer | Plain-English PR Summaries for Product Teams",
  description:
    "Paste a GitHub PR URL and instantly get a 3-bullet plain-English changelog that product, design, and ops stakeholders can understand.",
  keywords: [
    "GitHub PR summary",
    "release notes generator",
    "plain english changelog",
    "engineering communication",
    "developer productivity",
  ],
  openGraph: {
    title: "AI Diff Explainer",
    description:
      "Turn any GitHub PR into a 3-bullet stakeholder update in seconds. Built for solo tech leads and fast shipping teams.",
    type: "website",
    url: "https://ai-diff-explainer.com",
    siteName: "AI Diff Explainer",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Diff Explainer",
    description: "Paste a PR URL, get a stakeholder-ready 3-bullet summary.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
