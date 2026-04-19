import Link from "next/link";
import { redirect } from "next/navigation";
import { PRAnalyzer } from "@/components/pr-analyzer";
import { Button } from "@/components/ui/button";
import { hasPaidAccessServer } from "@/lib/auth";

export const metadata = {
  title: "Dashboard | AI Diff Explainer",
  description: "Analyze GitHub pull requests and generate 3-bullet non-technical summaries.",
};

export default async function DashboardPage() {
  const hasAccess = await hasPaidAccessServer();
  if (!hasAccess) {
    redirect("/#pricing");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 pb-20 pt-10 md:px-10">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-300">Paid Workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-100">PR Summary Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Create stakeholder-ready release bullets directly from any pull request.</p>
        </div>

        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <section className="mt-8">
        <PRAnalyzer />
      </section>
    </main>
  );
}
