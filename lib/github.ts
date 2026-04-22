import { Octokit } from "@octokit/rest";

const MAX_FILES_IN_PROMPT = 25;
const MAX_ISSUES = 10;
const ISSUE_REFERENCE_REGEX =
  /(?:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+))?#(\d+)/g;

export class GitHubIntegrationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "GitHubIntegrationError";
    this.status = status;
  }
}

export type PullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
};

export type PullRequestCommit = {
  sha: string;
  message: string;
  authoredAt: string | null;
};

export type LinkedIssue = {
  owner: string;
  repo: string;
  number: number;
  title: string;
  state: string;
  url: string;
};

export type PullRequestContext = {
  owner: string;
  repo: string;
  number: number;
  title: string;
  body: string;
  url: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
  commits: PullRequestCommit[];
  files: PullRequestFile[];
  linkedIssues: LinkedIssue[];
};

type ParsedPullRequestUrl = {
  owner: string;
  repo: string;
  number: number;
};

type IssueReference = {
  owner: string;
  repo: string;
  number: number;
};

function createOctokit() {
  const token = process.env.GITHUB_TOKEN;

  return new Octokit({
    auth: token,
    userAgent: "ai-diff-explainer/1.0",
  });
}

export function parsePullRequestUrl(prUrl: string): ParsedPullRequestUrl {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(prUrl);
  } catch {
    throw new GitHubIntegrationError("Invalid URL format.", 400);
  }

  if (parsedUrl.hostname !== "github.com") {
    throw new GitHubIntegrationError("Only github.com pull request URLs are supported.", 400);
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments.length < 4 || segments[2] !== "pull") {
    throw new GitHubIntegrationError(
      "Use a pull request URL like https://github.com/owner/repo/pull/123.",
      400
    );
  }

  const number = Number.parseInt(segments[3] ?? "", 10);
  if (Number.isNaN(number)) {
    throw new GitHubIntegrationError("Pull request number is missing in the URL.", 400);
  }

  const owner = segments[0] ?? "";
  const repo = segments[1] ?? "";

  if (!owner || !repo) {
    throw new GitHubIntegrationError("Repository owner and name are required in the URL.", 400);
  }

  return { owner, repo, number };
}

function truncatePatch(patch: string | null | undefined) {
  if (!patch) {
    return null;
  }

  const maxLength = 1800;
  if (patch.length <= maxLength) {
    return patch;
  }

  return `${patch.slice(0, maxLength)}\n... (patch truncated)`;
}

function extractIssueReferences({
  text,
  defaultOwner,
  defaultRepo,
}: {
  text: string;
  defaultOwner: string;
  defaultRepo: string;
}) {
  const references = new Map<string, IssueReference>();

  for (const match of text.matchAll(ISSUE_REFERENCE_REGEX)) {
    const owner = match[1] ?? defaultOwner;
    const repo = match[2] ?? defaultRepo;
    const number = Number.parseInt(match[3] ?? "", 10);

    if (!owner || !repo || Number.isNaN(number)) {
      continue;
    }

    const key = `${owner}/${repo}#${number}`;
    references.set(key, {
      owner,
      repo,
      number,
    });
  }

  return Array.from(references.values()).slice(0, MAX_ISSUES);
}

async function fetchLinkedIssues({
  octokit,
  references,
}: {
  octokit: Octokit;
  references: IssueReference[];
}) {
  const linkedIssues = await Promise.all(
    references.map(async (reference) => {
      try {
        const issueResponse = await octokit.issues.get({
          owner: reference.owner,
          repo: reference.repo,
          issue_number: reference.number,
        });

        return {
          owner: reference.owner,
          repo: reference.repo,
          number: reference.number,
          title: issueResponse.data.title,
          state: issueResponse.data.state,
          url: issueResponse.data.html_url,
        } satisfies LinkedIssue;
      } catch {
        return null;
      }
    })
  );

  return linkedIssues.filter((issue): issue is LinkedIssue => issue !== null);
}

export async function fetchPullRequestContext(prUrl: string): Promise<PullRequestContext> {
  const parsed = parsePullRequestUrl(prUrl);
  const octokit = createOctokit();

  let pullRequestData;
  try {
    const response = await octokit.pulls.get({
      owner: parsed.owner,
      repo: parsed.repo,
      pull_number: parsed.number,
    });

    pullRequestData = response.data;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      throw new GitHubIntegrationError(
        "Pull request not found or not accessible with current GitHub credentials.",
        404
      );
    }

    throw new GitHubIntegrationError("Failed to fetch pull request metadata from GitHub.", 502);
  }

  const [fileList, commitList] = await Promise.all([
    octokit.paginate(octokit.pulls.listFiles, {
      owner: parsed.owner,
      repo: parsed.repo,
      pull_number: parsed.number,
      per_page: 100,
    }),
    octokit.paginate(octokit.pulls.listCommits, {
      owner: parsed.owner,
      repo: parsed.repo,
      pull_number: parsed.number,
      per_page: 100,
    }),
  ]);

  const files: PullRequestFile[] = fileList.slice(0, MAX_FILES_IN_PROMPT).map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: truncatePatch(file.patch),
  }));

  const commits: PullRequestCommit[] = commitList.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    authoredAt: commit.commit.author?.date ?? null,
  }));

  const issueReferenceText = [
    pullRequestData.title,
    pullRequestData.body ?? "",
    ...commits.map((commit) => commit.message),
  ].join("\n");

  const issueReferences = extractIssueReferences({
    text: issueReferenceText,
    defaultOwner: parsed.owner,
    defaultRepo: parsed.repo,
  });

  const linkedIssues = await fetchLinkedIssues({
    octokit,
    references: issueReferences,
  });

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    number: parsed.number,
    title: pullRequestData.title,
    body: pullRequestData.body ?? "",
    url: pullRequestData.html_url,
    author: pullRequestData.user?.login ?? "unknown",
    baseBranch: pullRequestData.base.ref,
    headBranch: pullRequestData.head.ref,
    additions: pullRequestData.additions,
    deletions: pullRequestData.deletions,
    changedFiles: pullRequestData.changed_files,
    createdAt: pullRequestData.created_at,
    mergedAt: pullRequestData.merged_at,
    labels: pullRequestData.labels
      .map((label) => (typeof label === "string" ? label : label.name ?? ""))
      .filter(Boolean),
    commits,
    files,
    linkedIssues,
  };
}
