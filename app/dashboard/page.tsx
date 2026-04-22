import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { PRAnalyzer } from "@/components/pr-analyzer";
import { PricingCards } from "@/components/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import {
  ACCESS_COOKIE_NAME,
  getUsageCount,
  verifyAccessToken,
} from "@/lib/database";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Analyze GitHub pull requests and generate stakeholder changelogs.",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(token);
  const usageCount = access ? getUsageCount(access.email) : 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-20 pt-10 md:px-8">
      <header className="flex flex-col gap-4 rounded-xl border border-[#30363d] bg-[#161b22]/85 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#f0f6fc]">AI Diff Explainer Dashboard</h1>
          <p className="text-sm text-[#8b949e]">
            Analyze pull requests and generate concise release communication for product,
            design, and leadership.
          </p>
          {access ? (
            <p className="text-xs text-[#79c0ff]">
              Active account: {access.email} · PR summaries generated: {usageCount}
            </p>
          ) : (
            <p className="text-xs text-[#f0883e]">No active access token found. Buy and unlock below.</p>
          )}
        </div>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-fit") }>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Landing Page
        </Link>
      </header>

      {!access && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[#f0f6fc]">Buy Access</h2>
          <p className="text-sm text-[#8b949e]">
            Choose a plan in Stripe Checkout, then unlock the analyzer using your purchase email.
          </p>
          <PricingCards compact />
        </section>
      )}

      <PRAnalyzer initialAccess={Boolean(access)} unlockedEmail={access?.email} />
    </main>
  );
}
