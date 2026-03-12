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

export const renderBlogPage = async (
    blog: Blog,
    inscribe: InscribeConfig,
    sourceDir: string,
    isDev: boolean = false
) => {
    const html = await markdown2HTML(blog.markdown, blog.isMDX);
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    return env.render("blog.njk", {
        blog,
        config: inscribe,
        content: html,
        themeCSS,
        isDev
    });
};

export const renderIndexPage = (
    blogs: Blog[],
    inscribe: InscribeConfig,
    sourceDir: string,
    isDev: boolean = false
) => {
    const env = getRenderer(sourceDir);
    const themeCSS = resolveThemeCSS(inscribe.theme ?? 'default', sourceDir);

    return env.render("blog_index.njk", {
        blogs,
        config: inscribe,
        themeCSS,
        isDev
    });
};
