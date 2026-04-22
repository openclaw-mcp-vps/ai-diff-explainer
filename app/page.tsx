import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileDiff,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-5 pb-20 pt-12 md:px-8 md:pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs font-medium text-[#8b949e]">
            Developer Productivity · Release Communication
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#f0f6fc] md:text-6xl md:leading-[1.1]">
            AI Diff Explainer
            <span className="mt-2 block text-[#3fb950]">
              Turn any PR into a 3-bullet stakeholder changelog
            </span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#c9d1d9] md:text-lg">
            Paste a GitHub pull request URL. We analyze the diff, commits, and linked issues,
            then return plain-English release notes you can drop into Slack or email in under 20
            seconds.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto") }>
              Open Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={stripePaymentLink}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto"
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy Access ($5 / PR or $29/mo)
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-[#30363d] bg-[#161b22]/90 p-6 shadow-[0_20px_60px_-30px_rgba(63,185,80,0.35)]">
          <h2 className="mb-4 text-lg font-semibold text-[#f0f6fc]">Sample output format</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-[#c9d1d9]">
            <li className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
              • Checkout is now more resilient: users get clearer errors and fewer failed payments.
            </li>
            <li className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
              • Product analytics now capture post-purchase events, giving PMs cleaner funnel
              visibility.
            </li>
            <li className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
              • Deployment risk is low-to-medium because logic changes are isolated to checkout and
              telemetry paths.
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-[#30363d] bg-[#161b22]/75 p-6">
          <Clock3 className="mb-4 h-6 w-6 text-[#f0883e]" />
          <h3 className="mb-2 text-lg font-semibold text-[#f0f6fc]">The Problem</h3>
          <p className="text-sm leading-relaxed text-[#c9d1d9]">
            Engineers lose 10-20 minutes per PR translating technical work into stakeholder language.
            Small teams shipping daily feel this drag every sprint.
          </p>
        </article>
        <article className="rounded-xl border border-[#30363d] bg-[#161b22]/75 p-6">
          <FileDiff className="mb-4 h-6 w-6 text-[#79c0ff]" />
          <h3 className="mb-2 text-lg font-semibold text-[#f0f6fc]">The Solution</h3>
          <p className="text-sm leading-relaxed text-[#c9d1d9]">
            AI Diff Explainer reads actual PR context: commit intent, changed files, and linked issue
            goals. Output is concise, accurate, and ready to send.
          </p>
        </article>
        <article className="rounded-xl border border-[#30363d] bg-[#161b22]/75 p-6">
          <MessageSquareText className="mb-4 h-6 w-6 text-[#3fb950]" />
          <h3 className="mb-2 text-lg font-semibold text-[#f0f6fc]">Who Uses It</h3>
          <p className="text-sm leading-relaxed text-[#c9d1d9]">
            Solo tech leads, startup CTOs, and EMs who regularly update product/design teams without
            writing custom release notes from scratch.
          </p>
        </article>
      </section>

      <section id="pricing" className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-[#f0f6fc]">Pricing</h2>
          <p className="text-[#8b949e]">
            Start pay-as-you-go, then switch to unlimited when your team ships every day.
          </p>
        </div>
        <PricingCards />
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold text-[#f0f6fc]">Why teams stick with it</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {[
            "Turns PR context into language PMs and designers can act on quickly.",
            "Avoids over-technical wording that creates more follow-up questions.",
            "Maintains consistent update quality across multiple engineers.",
            "Cuts repetitive communication overhead from every release cycle.",
          ].map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 rounded-lg border border-[#30363d] bg-[#161b22]/70 p-4 text-sm text-[#c9d1d9]"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3fb950]" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold text-[#f0f6fc]">FAQ</h2>
        <div className="space-y-3">
          <details className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-4">
            <summary className="cursor-pointer list-none text-base font-semibold text-[#f0f6fc]">
              Do I need to connect a GitHub app?
            </summary>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              No. For public repositories, paste a PR URL and analyze immediately. For private repos,
              set a `GITHUB_TOKEN` server environment variable to allow authenticated reads.
            </p>
          </details>
          <details className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-4">
            <summary className="cursor-pointer list-none text-base font-semibold text-[#f0f6fc]">
              Will this replace release notes entirely?
            </summary>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              It handles first-draft release communication extremely well. Teams often paste the output
              directly, or make small edits for tone and audience.
            </p>
          </details>
          <details className="rounded-lg border border-[#30363d] bg-[#161b22]/70 p-4">
            <summary className="cursor-pointer list-none text-base font-semibold text-[#f0f6fc]">
              How does paywall access work?
            </summary>
            <p className="mt-2 text-sm text-[#c9d1d9]">
              Purchase through Stripe Checkout, then unlock with your checkout email on the dashboard.
              Access is stored in an HTTP-only cookie for repeat use.
            </p>
          </details>
        </div>
      </section>

      <section className="rounded-xl border border-[#3fb950]/40 bg-[#161b22] p-8 text-center">
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-[#3fb950]" />
        <h2 className="text-2xl font-semibold text-[#f0f6fc] md:text-3xl">
          Ship faster and keep non-engineers in sync
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#c9d1d9] md:text-base">
          One clean PR summary can save 15 minutes of writing and multiple rounds of clarification.
          Multiply that by your weekly deploy count and this pays for itself quickly.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
            Try the Dashboard
          </Link>
          <a
            href={stripePaymentLink}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy via Stripe
          </a>
        </div>
      </section>
    </main>
  );
}
