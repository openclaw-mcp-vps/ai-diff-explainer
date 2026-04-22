"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ExternalLink,
  GitPullRequest,
  Loader2,
  Lock,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const analyzeSchema = z.object({
  prUrl: z
    .string()
    .url("Provide a full URL.")
    .refine(
      (value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(value),
      "Use a GitHub pull request URL like https://github.com/org/repo/pull/123"
    ),
});

const unlockSchema = z.object({
  email: z.string().email("Enter the same email used during checkout."),
});

type AnalyzeFormValues = z.infer<typeof analyzeSchema>;
type UnlockFormValues = z.infer<typeof unlockSchema>;

type AnalyzeResponse = {
  bullets: string[];
  pr: {
    title: string;
    repository: string;
    number: number;
    url: string;
  };
};

type PRAnalyzerProps = {
  initialAccess: boolean;
  unlockedEmail?: string | null;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error) {
    return payload.error;
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message) {
    return payload.message;
  }

  return fallback;
}

export function PRAnalyzer({ initialAccess, unlockedEmail }: PRAnalyzerProps) {
  const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const [hasAccess, setHasAccess] = useState(initialAccess);
  const [activeEmail, setActiveEmail] = useState<string | null>(unlockedEmail ?? null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const analyzeForm = useForm<AnalyzeFormValues>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      prUrl: "",
    },
  });

  const unlockForm = useForm<UnlockFormValues>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      email: unlockedEmail ?? "",
    },
  });

  const accessBadge = useMemo(() => {
    if (!hasAccess) {
      return "Locked";
    }

    if (activeEmail) {
      return `Unlocked for ${activeEmail}`;
    }

    return "Unlocked";
  }, [activeEmail, hasAccess]);

  async function onAnalyze(values: AnalyzeFormValues) {
    setAnalyzeError(null);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const message = getErrorMessage(
          payload,
          "Could not analyze this PR. Confirm the URL and try again."
        );

        if (response.status === 402) {
          setHasAccess(false);
        }

        setAnalyzeError(message);
        return;
      }

      setAnalysis(payload as AnalyzeResponse);
    } catch {
      setAnalyzeError(
        "Network error while analyzing this pull request. Check your connection and retry."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function onUnlock(values: UnlockFormValues) {
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        error?: string;
        email?: string;
      };

      if (!response.ok) {
        setUnlockError(
          payload.error ??
            "No paid purchase found for this email yet. If you just paid, retry in 20 seconds."
        );
        return;
      }

      setHasAccess(true);
      setActiveEmail(payload.email ?? values.email);
      setUnlockError(null);
    } catch {
      setUnlockError("Unlock request failed. Please retry in a few seconds.");
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <div className="space-y-6">
      {!hasAccess && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-[#f0883e]" />
              Tool Access Is Locked
            </CardTitle>
            <CardDescription>
              Buy once, then unlock with your checkout email. Access is stored in an
              HTTP-only cookie for future visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
              <a
                href={stripePaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#3fb950] px-4 text-sm font-semibold text-[#0d1117] transition hover:bg-[#4acb5e]"
              >
                Buy Access in Stripe Checkout
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
              <p className="rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#8b949e]">
                After payment, return here and unlock with the email used at checkout.
              </p>
            </div>

            <form
              onSubmit={unlockForm.handleSubmit(onUnlock)}
              className="grid gap-3 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-1">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...unlockForm.register("email")}
                />
                {unlockForm.formState.errors.email && (
                  <p className="text-xs text-[#ff7b72]">
                    {unlockForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" variant="secondary" disabled={isUnlocking}>
                {isUnlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                <span className="ml-2">Unlock</span>
              </Button>
            </form>

            {unlockError && <p className="text-sm text-[#ff7b72]">{unlockError}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <GitPullRequest className="h-6 w-6 text-[#3fb950]" />
            PR Analyzer
          </CardTitle>
          <CardDescription>
            Paste a public GitHub PR URL. You will get exactly 3 bullets tuned for product,
            design, and business stakeholders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex items-center rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs text-[#8b949e]">
            {accessBadge}
          </div>

          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={analyzeForm.handleSubmit(onAnalyze)}
          >
            <div className="space-y-1">
              <Input
                type="url"
                placeholder="https://github.com/owner/repo/pull/123"
                {...analyzeForm.register("prUrl")}
                disabled={!hasAccess || isAnalyzing}
              />
              {analyzeForm.formState.errors.prUrl && (
                <p className="text-xs text-[#ff7b72]">
                  {analyzeForm.formState.errors.prUrl.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={!hasAccess || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Analyzing</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span className="ml-2">Generate 3-Bullet Summary</span>
                </>
              )}
            </Button>
          </form>

          {analyzeError && <p className="text-sm text-[#ff7b72]">{analyzeError}</p>}
        </CardContent>
      </Card>

      {analysis && (
        <Card className="border-[#3fb950]/40">
          <CardHeader>
            <CardTitle className="text-xl">Stakeholder Changelog</CardTitle>
            <CardDescription>
              {analysis.pr.repository} · PR #{analysis.pr.number} · {analysis.pr.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {analysis.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-md border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm leading-relaxed text-[#c9d1d9]"
                >
                  • {bullet}
                </li>
              ))}
            </ul>
            <a
              href={analysis.pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-[#79c0ff] hover:text-[#a5d6ff]"
            >
              Open source pull request
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
