import fs from "fs-extra";
import path from "path";
import nunjucks from "nunjucks";
import { markdown2HTML, parseFrontMatter } from "../utils/markdown";
import { Blog, BlogScehma } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";
import { resolveThemeCSS } from "./theme_resolver";

export const parseBlogPost = async (filePath: string) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, body } = parseFrontMatter(content);
    const isMDX = filePath.endsWith(".mdx");

    // Validate with Zod
    const validated = BlogScehma.parse({
        metadata: data,
        markdown: body,
        isMDX
    });

    return validated;
};

/**
 * Configure Nunjucks with a search path:
 * 1. User project layouts
 * 2. CLI built-in layouts
 */
const getRenderer = (sourceDir: string, config: InscribeConfig) => {
    const userLayouts = path.resolve(sourceDir, "layouts");
    const builtInLayouts = path.resolve(__dirname, "../../template/layouts");

    const searchPaths = [userLayouts, builtInLayouts];

    const env = new nunjucks.Environment(
        new nunjucks.FileSystemLoader(searchPaths),
        { autoescape: true }
    );

    env.addFilter('url', (urlPath: string) => {
        if (!urlPath) return urlPath;
        if (urlPath.startsWith('http') || urlPath.startsWith('//') || urlPath.startsWith('data:')) return urlPath;
        
        let base = config.base_url || '/';
        if (!base.endsWith('/')) base += '/';
        
        const pathSuffix = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
        return base + pathSuffix;
    });

    return env;
};

import { FolderMetadata } from "../schemas/folder";

export interface NavState {
    hasHome: boolean;
    hasBlog: boolean;
    hasDocs: boolean;
}

export type SidebarItem = 
    | { type: 'folder'; node: SidebarNode }
    | { type: 'file'; post: Blog };

export interface SidebarNode {
    title: string;
    path: string;
    weight: number;
    items: SidebarItem[];
}

const getSidebarTree = (posts: Blog[], folderMetadata: Record<string, FolderMetadata> = {}): SidebarNode[] => {
    // Root node — holds top-level files and sub-folder nodes
    const root: SidebarNode = { title: '', path: '', weight: 0, items: [] };

    // Map from path string to its SidebarNode (for quick lookup)
    const nodeMap = new Map<string, SidebarNode>();
    nodeMap.set('', root);

    // Helper: ensure all ancestor nodes exist for a given path
    const ensureNode = (dirPath: string): SidebarNode => {
        if (nodeMap.has(dirPath)) return nodeMap.get(dirPath)!;

        // Ensure parent exists first
        const parentPath = path.dirname(dirPath).replace(/\\/g, '/');
        const parent = ensureNode(parentPath === '.' ? '' : parentPath);

        const meta = folderMetadata[dirPath] || { title: path.basename(dirPath), weight: 0 };
        const node: SidebarNode = {
            title: meta.title || path.basename(dirPath),
            path: dirPath,
            weight: meta.weight || 0,
            items: [],
        };
        nodeMap.set(dirPath, node);
        parent.items.push({ type: 'folder', node });
        return node;
    };

    // Place each post in the correct node
    for (const post of posts) {
        let dir = path.dirname((post as any).relativePath || '').replace(/\\/g, '/');
        if (dir === '.') dir = '';
        const node = ensureNode(dir);
        node.items.push({ type: 'file', post });
    }

    // Recursively sort items within each node
    const sortNode = (node: SidebarNode) => {
        node.items.sort((a, b) => {
            const wA = a.type === 'folder' ? a.node.weight : (a.post.metadata.weight ?? 0);
            const wB = b.type === 'folder' ? b.node.weight : (b.post.metadata.weight ?? 0);
            
            if (wA !== wB) return wA - wB;
            
            const tA = a.type === 'folder' ? a.node.title : a.post.metadata.title;
            const tB = b.type === 'folder' ? b.node.title : b.post.metadata.title;
            return tA.localeCompare(tB);
        });

        for (const item of node.items) {
            if (item.type === 'folder') {
                sortNode(item.node);
            }
        }
    };
    sortNode(root);

    return root.items.length > 0 ? [root] : [];
};

export const renderSectionPage = async (
    type: 'blog' | 'doc',
    post: Blog,
    allPosts: Blog[],
    folderMetadata: Record<string, FolderMetadata>,
    inscribe: InscribeConfig,
    sourceDir: string,
    navState: NavState,
    isDev: boolean = false
) => {
    const html = await markdown2HTML(post.markdown, post.isMDX, inscribe);
    const env = getRenderer(sourceDir, inscribe);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    const template = type === 'blog' ? "blog.njk" : "doc.njk";
    
    const sidebarTree = type === 'doc' ? getSidebarTree(allPosts, folderMetadata) : [];
    const currentDirPath = path.dirname((post as any).relativePath || '').replace(/\\/g, '/').replace(/^\.$/, '');

    return env.render(template, {
        post, // rename to post instead of blog to be generic
        allPosts,
        sidebarTree,
        currentDirPath,
        blog: post,
        doc: post,
        config: inscribe,
        content: html,
        themeCSS,
        navState,
        isDev
    });
};

export const renderSectionIndexPage = (
    type: 'blog' | 'doc',
    posts: Blog[],
    folderMetadata: Record<string, FolderMetadata>,
    inscribe: InscribeConfig,
    sourceDir: string,
    navState: NavState,
    isDev: boolean = false
) => {
    const env = getRenderer(sourceDir, inscribe);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);
    
    const template = type === 'blog' ? "blog_index.njk" : "doc_index.njk";
    
    const sidebarTree = type === 'doc' ? getSidebarTree(posts, folderMetadata) : [];

    return env.render(template, {
        posts, // rename to posts
        allPosts: posts,
        sidebarTree,
        currentDirPath: '',
        blogs: posts,
        docs: posts,
        config: inscribe,
        themeCSS,
        navState,
        isDev
    });
};

export const renderHomePage = (
    inscribe: InscribeConfig,
    sourceDir: string,
    navState: NavState,
    isDev: boolean = false
) => {
    const env = getRenderer(sourceDir, inscribe);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    return env.render("home.njk", {
        config: inscribe,
        themeCSS,
        navState,
        isDev
    });
};

export const renderRedirectPage = (url: string) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0; url=${url}">
    <title>Redirecting...</title>
    <style>
        :root { color-scheme: light dark; }
        body {
            background-color: light-dark(#ffffff, #0f172a);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .message {
            color: light-dark(#0f172a, #f8fafc);
            opacity: 0;
            animation: fadeIn 0.5s ease-in forwards;
            animation-delay: 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
    <script>
        window.location.replace("${url}");
    </script>
</head>
<body>
    <div class="message">Redirecting you...</div>
</body>
</html>`;
};
