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
const getRenderer = (sourceDir: string) => {
    const userLayouts = path.resolve(sourceDir, "layouts");
    const builtInLayouts = path.resolve(__dirname, "../../template/layouts");

    const searchPaths = [userLayouts, builtInLayouts];

    return new nunjucks.Environment(
        new nunjucks.FileSystemLoader(searchPaths),
        { autoescape: true }
    );
};

import { FolderMetadata } from "../schemas/folder";

export interface NavState {
    hasHome: boolean;
    hasBlog: boolean;
    hasDocs: boolean;
}

const getSidebarGroups = (posts: Blog[], folderMetadata: Record<string, FolderMetadata> = {}) => {
    const grouped = posts.reduce((acc, p) => {
        let dir = path.dirname((p as any).relativePath || '');
        if (dir === '.') dir = '';
        if (!acc[dir]) acc[dir] = [];
        acc[dir].push(p);
        return acc;
    }, {} as Record<string, Blog[]>);

    return Object.entries(grouped)
        .map(([dir, p]) => {
            const meta = folderMetadata[dir] || { title: dir, weight: 0 };
            return { dir, dirTitle: meta.title || dir, weight: meta.weight || 0, posts: p };
        })
        .sort((a, b) => {
            if (a.weight !== b.weight) {
                return a.weight - b.weight;
            }
            return a.dirTitle.localeCompare(b.dirTitle);
        });
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
    const html = await markdown2HTML(post.markdown, post.isMDX);
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    const template = type === 'blog' ? "blog.njk" : "doc.njk";
    
    const sidebarGroups = type === 'doc' ? getSidebarGroups(allPosts, folderMetadata) : [];

    return env.render(template, {
        post, // rename to post instead of blog to be generic
        allPosts,
        sidebarGroups,
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
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);
    
    const template = type === 'blog' ? "blog_index.njk" : "doc_index.njk";
    
    const sidebarGroups = type === 'doc' ? getSidebarGroups(posts, folderMetadata) : [];

    return env.render(template, {
        posts, // rename to posts
        allPosts: posts,
        sidebarGroups,
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
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    return env.render("home.njk", {
        config: inscribe,
        themeCSS,
        navState,
        isDev
    });
};
