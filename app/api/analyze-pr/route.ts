import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  ACCESS_COOKIE_NAME,
  recordAnalysisUsage,
  verifyAccessToken,
} from "@/lib/database";
import {
  GitHubIntegrationError,
  fetchPullRequestContext,
} from "@/lib/github";
import { generateStakeholderSummary } from "@/lib/openai";

const requestSchema = z.object({
  prUrl: z.string().url(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;

  const access = verifyAccessToken(token);
  if (!access) {
    return NextResponse.json(
      {
        error:
          "Paid access is required. Complete Stripe checkout, then unlock with your checkout email.",
      },
      { status: 402 }
    );
  }

  const rawPayload = await request.json().catch(() => null);
  const payload = requestSchema.safeParse(rawPayload);

  if (!payload.success) {
    return NextResponse.json(
      { error: "Please send a valid GitHub PR URL." },
      { status: 400 }
    );
  }

  try {
    const context = await fetchPullRequestContext(payload.data.prUrl);
    const bullets = await generateStakeholderSummary(context);

    recordAnalysisUsage({
      email: access.email,
      prUrl: payload.data.prUrl,
      repository: `${context.owner}/${context.repo}`,
    });

    return NextResponse.json({
      bullets,
      pr: {
        title: context.title,
        repository: `${context.owner}/${context.repo}`,
        number: context.number,
        url: context.url,
      },
    });
  } catch (error) {
    if (error instanceof GitHubIntegrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          "Unable to analyze this pull request right now. Retry in a moment or verify the PR URL is accessible.",
      },
      { status: 500 }
    );
  }
}
