import { z } from "zod";
import { fetchPullRequestContext } from "@/lib/github";
import { summarizePullRequest } from "@/lib/openai";
import { hasPaidAccessRequest } from "@/lib/auth";

const BodySchema = z.object({
  prUrl: z.string().url(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasPaidAccessRequest(request)) {
    return Response.json({ error: "Payment required. Unlock access from the pricing section first." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const { prUrl } = BodySchema.parse(body);

    const context = await fetchPullRequestContext(prUrl);
    const summary = await summarizePullRequest(context);

    return Response.json({
      summary,
      context: {
        repository: `${context.owner}/${context.repo}`,
        title: context.prTitle,
        changedFiles: context.changedFiles,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("bad credentials") || message.includes("not found")) {
        return Response.json(
          {
            error:
              "Could not access this pull request. For private repos, set GITHUB_TOKEN with repo read permissions.",
          },
          { status: 400 },
        );
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ error: "Unexpected error while analyzing PR." }, { status: 500 });
  }
}
