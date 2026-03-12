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

export interface NavState {
    hasHome: boolean;
    hasBlog: boolean;
    hasDocs: boolean;
}

export const renderSectionPage = async (
    type: 'blog' | 'doc',
    post: Blog,
    inscribe: InscribeConfig,
    sourceDir: string,
    navState: NavState,
    isDev: boolean = false
) => {
    const html = await markdown2HTML(post.markdown, post.isMDX);
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    const template = type === 'blog' ? "blog.njk" : "doc.njk";

    return env.render(template, {
        post, // rename to post instead of blog to be generic
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
    inscribe: InscribeConfig,
    sourceDir: string,
    navState: NavState,
    isDev: boolean = false
) => {
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);
    
    const template = type === 'blog' ? "blog_index.njk" : "doc_index.njk";

    return env.render(template, {
        posts, // rename to posts
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
