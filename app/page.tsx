import Link from "next/link";
import { ArrowRight, CheckCircle2, Timer, MessageSquareText, Rocket } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const faq = [
  {
    question: "What input does the tool need?",
    answer:
      "A GitHub pull request URL. The app reads the PR title, description, changed files, and commit messages to produce a non-technical summary.",
  },
  {
    question: "Will this work for private repositories?",
    answer:
      "Yes, if you provide a GitHub token in your environment. Without a token, analysis is limited to public repositories.",
  },
  {
    question: "How is this different from asking an AI model directly?",
    answer:
      "This app is tuned for stakeholder communication. It removes implementation noise and outputs exactly three concise bullets optimized for release updates.",
  },
  {
    question: "How do I unlock the dashboard after checkout?",
    answer:
      "After payment, you are redirected back and receive an access cookie. If your browser blocks redirects, use the unlock link in the pricing section.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 md:px-10">
      <header className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="text-sm font-semibold tracking-wide text-zinc-100">AI Diff Explainer</p>
        <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-zinc-100">
          Open Dashboard
        </Link>
      </header>

      <section className="relative mt-12 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 md:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
            <Rocket className="h-3.5 w-3.5" />
            Built for solo tech leads shipping daily
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-zinc-100 md:text-5xl">
            Paste a GitHub PR URL. Get a plain-English changelog in 30 seconds.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-zinc-300">
            AI Diff Explainer turns implementation-heavy pull requests into three clean bullet points for product, design, and operations stakeholders. No more
            rewriting release notes after every merge.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#pricing">
              <Button size="lg">
                Start with $5 PR Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <Card>
          <Timer className="h-5 w-5 text-emerald-400" />
          <CardTitle className="mt-4">Problem: 15 minutes lost per PR</CardTitle>
          <CardDescription className="mt-2">
            Engineers spend real time translating technical diffs into language non-engineers can use for release notes and stakeholder updates.
          </CardDescription>
        </Card>

        <Card>
          <MessageSquareText className="h-5 w-5 text-emerald-400" />
          <CardTitle className="mt-4">Solution: automatic plain-English summary</CardTitle>
          <CardDescription className="mt-2">
            Pull in diff + commits + issue context, then generate exactly three stakeholder-friendly bullets ready for Slack or email.
          </CardDescription>
        </Card>

        <Card>
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <CardTitle className="mt-4">Outcome: faster shipping communication</CardTitle>
          <CardDescription className="mt-2">
            Keep product and design aligned on what changed without forcing engineers to write custom summaries every single time.
          </CardDescription>
        </Card>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-zinc-100">Pricing</h2>
        <p className="mt-3 max-w-2xl text-zinc-300">Start with one PR for $5 or move to unlimited for $29/month when this becomes part of your release process.</p>
        <div className="mt-6">
          <Pricing />
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <h2 className="text-3xl font-bold text-zinc-100">Frequently asked questions</h2>
        <div className="mt-6 space-y-6">
          {faq.map((item) => (
            <div key={item.question}>
              <h3 className="text-lg font-semibold text-zinc-100">{item.question}</h3>
              <p className="mt-2 text-zinc-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
