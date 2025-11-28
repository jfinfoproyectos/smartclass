
export const githubService = {
    parseGitHubUrl(url: string) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            // Expected format: /owner/repo or /owner/repo/tree/branch/...
            if (pathParts.length < 2) return null;

            const owner = pathParts[0];
            let repo = pathParts[1];
            if (repo.endsWith(".git")) {
                repo = repo.slice(0, -4);
            }

            // Simple assumption: if no tree/branch specified, use default (handled by API usually, or we default to main/master)
            // If user provides a direct file link (blob), we might need to handle that too, but for now let's assume repo root + file paths from activity config

            return { owner, repo };
        } catch (e) {
            return null;
        }
    },

    async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
        try {
            // Use raw.githubusercontent.com for simpler raw content fetching
            // Format: https://raw.githubusercontent.com/owner/repo/HEAD/path/to/file
            // Using HEAD to get the default branch's latest version is a safe bet if we don't know the branch
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Failed to fetch ${url}: ${response.statusText}`);
                return null;
            }

            return await response.text();
        } catch (error) {
            console.error("Error fetching file from GitHub:", error);
            return null;
        }
    },

    async getRepoStructure(owner: string, repo: string): Promise<string[]> {
        try {
            // Use GitHub API to get the tree
            // https://api.github.com/repos/OWNER/REPO/git/trees/HEAD?recursive=1
            const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Failed to fetch repo structure: ${response.statusText}`);
                return [];
            }

            const data = await response.json();
            if (!data.tree || !Array.isArray(data.tree)) {
                return [];
            }

            // Filter only blobs (files), ignore trees (directories)
            return data.tree
                .filter((item: any) => item.type === "blob")
                .map((item: any) => item.path);
        } catch (error) {
            console.error("Error fetching repo structure:", error);
            return [];
        }
    }
};
