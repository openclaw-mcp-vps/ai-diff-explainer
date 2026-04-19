import OpenAI from "openai";
import { z } from "zod";
import type { PullRequestContext } from "@/lib/github";

const SummarySchema = z.object({
  bullets: z.array(z.string().min(8).max(220)).length(3),
});

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  return new OpenAI({ apiKey });
}

function compactDiffForPrompt(context: PullRequestContext) {
  const files = context.fileDiffs.slice(0, 20).map((file) => {
    const header = `${file.filename} (+${file.additions}/-${file.deletions}, ${file.status})`;
    if (!file.patch) return header;
    return `${header}\n${file.patch}`;
  });

  return files.join("\n\n---\n\n");
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object" && "type" in item && "text" in item) {
          const maybeText = item as { type?: string; text?: string };
          if (maybeText.type === "text" && typeof maybeText.text === "string") {
            return maybeText.text;
          }
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function fallbackBullets(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  const bullets = lines.slice(0, 3);

  while (bullets.length < 3) {
    bullets.push("Update delivered and ready for stakeholder review.");
  }

  return bullets;
}

export async function summarizePullRequest(context: PullRequestContext) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const prompt = [
    "Summarize this pull request for non-technical stakeholders.",
    "Output valid JSON only with shape: {\"bullets\": [string, string, string]}.",
    "Each bullet must be one sentence, plain English, no code words, no acronyms unless unavoidable.",
    "Focus on customer impact, workflow impact, and risk/rollout notes.",
    "If linked issues are present, include their business context.",
    "",
    `Repository: ${context.owner}/${context.repo}`,
    `PR: ${context.prTitle}`,
    `Author: ${context.prAuthor}`,
    `Stats: +${context.additions} / -${context.deletions} across ${context.changedFiles} files`,
    `PR Description: ${context.prBody || "(empty)"}`,
    `Commit Messages: ${context.commitMessages.join(" | ") || "(none)"}`,
    `Linked Issues: ${
      context.linkedIssues.length
        ? context.linkedIssues.map((issue) => `#${issue.number} ${issue.title} (${issue.state})`).join(" | ")
        : "(none)"
    }`,
    "Diff Excerpts:",
    compactDiffForPrompt(context),
  ].join("\n");

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You create executive-ready release note summaries from code changes. Always produce exactly three bullets in JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = extractTextContent(response.choices[0]?.message?.content ?? "");

  try {
    const maybeJson = JSON.parse(content);
    const parsed = SummarySchema.parse(maybeJson);
    return parsed;
  } catch {
    const bullets = fallbackBullets(content);
    return SummarySchema.parse({ bullets });
  }
}
