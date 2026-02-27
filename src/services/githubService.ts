
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

    async getFileContent(owner: string, repo: string, path: string, token?: string, retries = 3): Promise<string | null> {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, { headers });

                if (!response.ok) {
                    if (response.status === 429 || response.status >= 500) {
                        if (attempt < retries) {
                            const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
                            console.warn(`[GitHubService] HTTP ${response.status} en ${path}. Reintentando en ${delayMs}ms (Intento ${attempt}/${retries})...`);
                            await new Promise(resolve => setTimeout(resolve, delayMs));
                            continue;
                        }
                    }
                    console.error(`Failed to fetch ${url}: ${response.statusText}`);
                    return null;
                }

                return await response.text();
            } catch (error) {
                if (attempt < retries) {
                    const delayMs = 1000 * Math.pow(2, attempt - 1);
                    console.warn(`[GitHubService] Network error en ${path}. Reintentando en ${delayMs}ms (Intento ${attempt}/${retries})...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
                console.error("Error fetching file from GitHub:", error);
                return null;
            }
        }
        return null;
    },

    async getRepoStructure(owner: string, repo: string, token?: string): Promise<string[]> {
        try {
            // Use GitHub API to get the tree
            // https://api.github.com/repos/OWNER/REPO/git/trees/HEAD?recursive=1
            const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, { headers });

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
