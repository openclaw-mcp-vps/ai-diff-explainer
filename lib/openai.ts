import OpenAI from "openai";
import { z } from "zod";
import type { PullRequestContext } from "@/lib/github";

const responseSchema = z.object({
  bullets: z.array(z.string().min(24).max(260)).length(3),
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function titleCaseFromPath(path: string) {
  const chunk = path.split("/")[0] ?? "application";
  return chunk
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fallbackSummary(context: PullRequestContext) {
  const topAreas = Array.from(
    new Set(context.files.slice(0, 4).map((file) => titleCaseFromPath(file.filename)))
  );

  const areaSentence =
    topAreas.length > 0
      ? `mostly in ${topAreas.join(", ")}`
      : "across core application areas";

  const linkedIssueSentence =
    context.linkedIssues.length > 0
      ? `It also aligns to ${context.linkedIssues.length} linked issue${
          context.linkedIssues.length === 1 ? "" : "s"
        } including ${context.linkedIssues
          .slice(0, 2)
          .map((issue) => `#${issue.number} ${issue.title}`)
          .join(" and ")}.`
      : "No linked issue references were detected in the PR title, body, or commits.";

  return [
    `This PR delivers \"${context.title}\" and updates ${context.changedFiles} file${
      context.changedFiles === 1 ? "" : "s"
    }, ${areaSentence}.`,
    `Engineering scope is moderate (${context.additions} additions, ${context.deletions} deletions), which suggests a meaningful release with stakeholder-visible changes rather than a trivial refactor.`,
    linkedIssueSentence,
  ];
}

function buildPrompt(context: PullRequestContext) {
  const condensedContext = {
    pullRequest: {
      repository: `${context.owner}/${context.repo}`,
      number: context.number,
      title: context.title,
      body: context.body,
      author: context.author,
      baseBranch: context.baseBranch,
      headBranch: context.headBranch,
      changedFiles: context.changedFiles,
      additions: context.additions,
      deletions: context.deletions,
      labels: context.labels,
    },
    commits: context.commits.slice(0, 12).map((commit) => ({
      sha: commit.sha.slice(0, 8),
      message: commit.message,
    })),
    files: context.files.slice(0, 20).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    })),
    linkedIssues: context.linkedIssues,
  };

  return [
    "Summarize this pull request for non-technical stakeholders.",
    "Output strict JSON: {\"bullets\": [\"...\", \"...\", \"...\"]}",
    "Rules:",
    "- Exactly 3 bullets, each one sentence.",
    "- Focus on user impact, product behavior, and release risk.",
    "- Avoid code jargon and avoid mentioning file names unless critical.",
    "- Keep each bullet under 260 characters.",
    JSON.stringify(condensedContext, null, 2),
  ].join("\n\n");
}

function parseJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in model output.");
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
}

export async function generateStakeholderSummary(context: PullRequestContext) {
  const fallback = fallbackSummary(context);

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You write release-note bullets for product, design, support, and leadership audiences.",
        },
        {
          role: "user",
          content: buildPrompt(context),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (typeof content !== "string") {
      return fallback;
    }

    const parsed = responseSchema.parse(parseJsonObject(content));
    return parsed.bullets;
  } catch {
    return fallback;
  }
}
