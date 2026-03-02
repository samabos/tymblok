import { Octokit } from 'octokit';
import type { IGitHubTokenProvider, GitHubPR } from './types';

/**
 * Fetches GitHub PRs using a token provided by the IDE layer.
 * IDE-agnostic — VS Code provides token via vscode.authentication,
 * JetBrains would provide via its own mechanism.
 */
export class GitHubService {
  constructor(private readonly tokenProvider: IGitHubTokenProvider) {}

  /** Get PRs where the user is requested as a reviewer */
  async getReviewRequests(): Promise<GitHubPR[]> {
    const token = await this.tokenProvider.getToken(['repo', 'read:org', 'notifications']);
    if (!token) return [];

    const octokit = new Octokit({ auth: token });

    try {
      // Get authenticated user
      const { data: user } = await octokit.rest.users.getAuthenticated();

      // Search for PRs where the user is a requested reviewer
      const { data: searchResult } = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:open review-requested:${user.login}`,
        per_page: 50,
        sort: 'updated',
        order: 'desc',
      });

      return searchResult.items.map((item) => {
        // Parse owner/repo from the repository_url
        const repoUrl = item.repository_url || '';
        const parts = repoUrl.split('/');
        const owner = parts[parts.length - 2] || '';
        const repo = parts[parts.length - 1] || '';

        return {
          id: item.id,
          number: item.number,
          title: item.title,
          repo,
          owner,
          author: item.user?.login || 'unknown',
          url: item.html_url,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          isDraft: (item as { draft?: boolean }).draft || false,
          reviewRequested: true,
        };
      });
    } catch {
      return [];
    }
  }

  /** Sync PRs to the Tymblok backend as inbox items */
  async syncToBackend(
    prs: GitHubPR[],
    axios: { post: (url: string, data: unknown) => Promise<unknown> },
  ): Promise<{ created: number; updated: number }> {
    if (prs.length === 0) return { created: 0, updated: 0 };

    try {
      const response = await axios.post('/integrations/vscode/sync-prs', {
        pullRequests: prs.map((pr) => ({
          externalId: `github:${pr.owner}/${pr.repo}#${pr.number}`,
          title: `Review: ${pr.title}`,
          subtitle: `${pr.owner}/${pr.repo}#${pr.number} by ${pr.author}`,
          url: pr.url,
          source: 'github',
          priority: 'high',
          metadata: JSON.stringify({
            repo: `${pr.owner}/${pr.repo}`,
            number: pr.number,
            author: pr.author,
            isDraft: pr.isDraft,
          }),
        })),
      });
      return (response as { data: { created: number; updated: number } }).data || { created: 0, updated: 0 };
    } catch {
      return { created: 0, updated: 0 };
    }
  }
}
