import { Octokit } from "@octokit/rest";

export type ParsedPrUrl = {
  owner: string;
  repo: string;
  pullNumber: number;
};

export type PullRequestContext = {
  owner: string;
  repo: string;
  pullNumber: number;
  prTitle: string;
  prBody: string;
  prAuthor: string;
  prUrl: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  fileDiffs: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch: string;
  }>;
  commitMessages: string[];
  linkedIssues: Array<{
    number: number;
    title: string;
    state: "open" | "closed";
    url: string;
  }>;
};

const ISSUE_REF_REGEX = /#(\d+)/g;

export function parsePullRequestUrl(url: string): ParsedPrUrl {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Please enter a valid GitHub pull request URL.");
  }

  if (parsed.hostname !== "github.com") {
    throw new Error("Only github.com pull request URLs are supported.");
  }

  const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/);
  if (!match) {
    throw new Error("URL must look like: https://github.com/owner/repo/pull/123");
  }

  return {
    owner: match[1],
    repo: match[2],
    pullNumber: Number(match[3]),
  };
}

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit({ auth: token, userAgent: "ai-diff-explainer/1.0.0" });
}

function trimPatch(patch: string | undefined, maxChars = 1800) {
  if (!patch) return "";
  if (patch.length <= maxChars) return patch;
  return `${patch.slice(0, maxChars)}\n... [diff truncated]`;
}

function extractIssueNumbers(texts: string[]) {
  const numbers = new Set<number>();

  for (const text of texts) {
    for (const match of text.matchAll(ISSUE_REF_REGEX)) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value > 0) {
        numbers.add(value);
      }
    }
  }

  return [...numbers].slice(0, 15);
}

export async function fetchPullRequestContext(prUrl: string): Promise<PullRequestContext> {
  const { owner, repo, pullNumber } = parsePullRequestUrl(prUrl);
  const octokit = getOctokit();

  const [pr, files, commits] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number: pullNumber }),
    octokit.paginate(octokit.pulls.listFiles, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    }),
    octokit.paginate(octokit.pulls.listCommits, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    }),
  ]);

  const commitMessages = commits
    .map((commit) => commit.commit.message.split("\n")[0]?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 30);

  const issueNumbers = extractIssueNumbers([
    pr.data.body ?? "",
    ...commitMessages,
  ]).filter((number) => number !== pullNumber);

  const linkedIssues = (
    await Promise.all(
      issueNumbers.map(async (issueNumber) => {
        try {
          const issue = await octokit.issues.get({ owner, repo, issue_number: issueNumber });

          if ((issue.data as { pull_request?: unknown }).pull_request) {
            return null;
          }

          return {
            number: issueNumber,
            title: issue.data.title,
            state: issue.data.state as "open" | "closed",
            url: issue.data.html_url,
          };
        } catch {
          return null;
        }
      }),
    )
  ).filter((issue): issue is NonNullable<typeof issue> => issue !== null);

  return {
    owner,
    repo,
    pullNumber,
    prTitle: pr.data.title,
    prBody: pr.data.body ?? "",
    prAuthor: pr.data.user?.login ?? "unknown",
    prUrl,
    additions: pr.data.additions,
    deletions: pr.data.deletions,
    changedFiles: pr.data.changed_files,
    fileDiffs: files.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: trimPatch(file.patch),
    })),
    commitMessages,
    linkedIssues,
  };
}
