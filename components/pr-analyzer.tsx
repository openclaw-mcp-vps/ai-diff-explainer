"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const FormSchema = z.object({
  prUrl: z
    .string()
    .url("Please enter a valid URL")
    .refine((url) => url.includes("github.com") && url.includes("/pull/"), {
      message: "Enter a GitHub PR URL like https://github.com/org/repo/pull/123",
    }),
});

type FormValues = z.infer<typeof FormSchema>;

type AnalysisResponse = {
  summary: {
    bullets: string[];
  };
  context: {
    repository: string;
    title: string;
    changedFiles: number;
  };
};

export function PRAnalyzer() {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prUrl: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    setError(null);
    setResult(null);
    setCopied(false);

    const response = await fetch("/api/analyze-pr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Something went wrong while analyzing this PR.");
      return;
    }

    const body = (await response.json()) as AnalysisResponse;
    setResult(body);
  }

  async function copySummary() {
    if (!result) return;

    const text = result.summary.bullets.map((bullet) => `• ${bullet}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <CardTitle>Generate a stakeholder-ready summary</CardTitle>
        <CardDescription className="mt-2">
          Paste a pull request URL and get 3 clear bullets you can drop into Slack, Notion, or release notes.
        </CardDescription>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-3">
          <div className="space-y-2">
            <Input
              placeholder="https://github.com/owner/repo/pull/123"
              aria-label="GitHub pull request URL"
              {...form.register("prUrl")}
            />
            {form.formState.errors.prUrl ? (
              <p className="text-sm text-rose-400">{form.formState.errors.prUrl.message}</p>
            ) : null}
          </div>

          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing diff...
              </>
            ) : (
              "Generate 3-Bullet Summary"
            )}
          </Button>
        </form>
      </Card>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/5">
          <div className="flex items-start gap-3 text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        </Card>
      ) : null}

      {result ? (
        <Card className="space-y-5">
          <div>
            <p className="text-sm text-zinc-400">{result.context.repository}</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-100">{result.context.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{result.context.changedFiles} files changed</p>
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            {result.summary.bullets.map((bullet, index) => (
              <p key={index} className="text-sm leading-relaxed text-zinc-200">
                <span className="mr-2 text-emerald-400">•</span>
                {bullet}
              </p>
            ))}
          </div>

          <Button variant="outline" onClick={copySummary} className="w-full md:w-auto">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy for Slack/Email"}
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
