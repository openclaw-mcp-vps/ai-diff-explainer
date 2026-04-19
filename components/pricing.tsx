"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function buildFallbackCheckoutUrl() {
  const raw = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID?.trim();
  if (!raw) return "";

  const base = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://checkout.lemonsqueezy.com/buy/${raw}`;

  try {
    const url = new URL(base);
    if (typeof window !== "undefined") {
      url.searchParams.set("checkout[success_url]", `${window.location.origin}/api/webhooks/lemonsqueezy?checkout=success`);
      url.searchParams.set("checkout[cancel_url]", `${window.location.origin}/#pricing`);
    }
    return url.toString();
  } catch {
    return base;
  }
}

export function Pricing() {
  const [checkoutUrl, setCheckoutUrl] = useState("");

  useEffect(() => {
    const successUrl = `${window.location.origin}/api/webhooks/lemonsqueezy?checkout=success`;
    const cancelUrl = `${window.location.origin}/#pricing`;

    async function loadCheckoutUrl() {
      try {
        const response = await fetch("/api/checkout-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ successUrl, cancelUrl }),
        });

        if (response.ok) {
          const body = (await response.json()) as { url?: string };
          if (body.url) {
            setCheckoutUrl(body.url);
            return;
          }
        }
      } catch {
        // Fall through to static URL fallback.
      }

      setCheckoutUrl(buildFallbackCheckoutUrl());
    }

    void loadCheckoutUrl();
  }, []);

  const features = useMemo(
    () => [
      "Analyze any public GitHub PR in seconds",
      "Readable 3-bullet summary for product/design/ops",
      "Pulls in commit messages and linked issue context",
      "Copy-ready output for Slack or release emails",
      "Unlimited summaries on the monthly plan",
    ],
    [],
  );

  return (
    <div id="pricing" className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden border-zinc-800">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <CardTitle>Pay-as-you-ship</CardTitle>
        <CardDescription className="mt-2">Best for teams with occasional releases.</CardDescription>
        <p className="mt-6 text-4xl font-bold text-zinc-100">$5</p>
        <p className="text-sm text-zinc-400">per pull request summary</p>

        <a
          href={checkoutUrl || "#"}
          className="lemonsqueezy-button mt-6 inline-flex w-full"
          aria-label="Buy single PR analysis"
        >
          <Button className="w-full" size="lg" disabled={!checkoutUrl}>
            Buy Single Analysis
          </Button>
        </a>
      </Card>

      <Card className="border-emerald-400/30 bg-emerald-400/5">
        <p className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          Most teams pick this
        </p>
        <CardTitle className="mt-4">Unlimited Monthly</CardTitle>
        <CardDescription className="mt-2">For leads who ship daily and need zero note-writing overhead.</CardDescription>
        <p className="mt-6 text-4xl font-bold text-zinc-100">$29</p>
        <p className="text-sm text-zinc-400">per month, unlimited PR summaries</p>

        <a href={checkoutUrl || "#"} className="lemonsqueezy-button mt-6 inline-flex w-full" aria-label="Start unlimited plan">
          <Button className="w-full" size="lg" disabled={!checkoutUrl}>
            Start Unlimited Plan
          </Button>
        </a>

        <ul className="mt-6 space-y-3 text-sm text-zinc-300">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="md:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
        Already completed checkout? <a className="text-emerald-300 underline" href="/api/webhooks/lemonsqueezy?checkout=success">Unlock your dashboard</a>
      </div>
    </div>
  );
}
