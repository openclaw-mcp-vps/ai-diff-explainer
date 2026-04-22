import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-diff-explainer.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Diff Explainer",
    template: "%s | AI Diff Explainer",
  },
  description:
    "Paste a GitHub PR URL and get a 3-bullet stakeholder summary for Slack or email in under 20 seconds.",
  keywords: [
    "AI changelog generator",
    "GitHub PR summary",
    "release notes automation",
    "engineering communication",
    "developer productivity",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "AI Diff Explainer",
    description:
      "Turn raw PR diffs into plain-English updates for product, design, and leadership.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Diff Explainer - PR summaries for non-technical stakeholders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Diff Explainer",
    description:
      "Auto-generate stakeholder-ready changelogs from GitHub pull requests.",
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
