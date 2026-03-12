import fs from "fs-extra";
import path from "path";
import { minifyHtml } from "../utils/minifier";
import { parseBlogPost, renderSectionPage, renderSectionIndexPage, renderHomePage, NavState } from "./renderer";
import { Blog } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";
import { readInscribeFile } from "./inscribe_reader";

export interface BuildOptions {
    sourceDir: string;
    outputDir: string;
    env: string;
}

const buildSection = async (
    type: 'blog' | 'doc',
    sourceDir: string,
    outputDir: string,
    files: string[],
    isRelease: boolean,
    inscribe: InscribeConfig,
    navState: NavState
) => {
    const posts: Blog[] = [];
    const singularFolder = type === 'blog' ? 'blog' : 'doc';

    await fs.ensureDir(path.join(outputDir, singularFolder));

    for (const filePath of files) {
        const post = await parseBlogPost(filePath);
        let fullHtml = await renderSectionPage(type, post, inscribe, sourceDir, navState);

        posts.push(post);

        if (isRelease) {
            fullHtml = await minifyHtml(fullHtml);
        }

        await fs.writeFile(path.join(outputDir, singularFolder, `${post.metadata.slug}.html`), fullHtml);
    }

    return posts;
}

export async function build(options: BuildOptions) {
    const { sourceDir, outputDir, env } = options;
    const isRelease = env === "release";

    // Read inscribe config
    const inscribe = await readInscribeFile(sourceDir);

    const blogPath = inscribe.blog_path === "null" || !inscribe.blog_path ? null : inscribe.blog_path;
    const docPath = inscribe.doc_path === "null" || !inscribe.doc_path ? null : inscribe.doc_path;
    const blogDir = blogPath ? path.join(sourceDir, blogPath) : null;
    const docDir = docPath ? path.join(sourceDir, docPath) : null;

    const hasBlog = blogDir ? fs.existsSync(blogDir) : false;
    const hasDocs = docDir ? fs.existsSync(docDir) : false;
    const hasHome = inscribe.show_home !== false;

    if (!hasBlog && !hasDocs && !hasHome) {
        throw new Error("At least one section (home, blog, or doc) must be active to generate the site.");
    }

    const navState: NavState = { hasHome, hasBlog, hasDocs };

    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    let redirectUrl = "";

    // Build blogs
    if (hasBlog && blogDir) {
        const blogFiles = fs.readdirSync(blogDir, { recursive: true })
            .filter((f): f is string => typeof f === "string" && (f.endsWith(".md") || f.endsWith(".mdx")))
            .map((file) => path.join(blogDir, file));
        
        console.log('No. of blog pages identified:', blogFiles.length);

        const blogs = await buildSection('blog', sourceDir, outputDir, blogFiles, isRelease, inscribe, navState);

        await fs.ensureDir(path.join(outputDir, "blogs"));
        let blogIndex = renderSectionIndexPage('blog', blogs, inscribe, sourceDir, navState);
        if (isRelease) blogIndex = await minifyHtml(blogIndex);
        await fs.writeFile(path.join(outputDir, "blogs", "index.html"), blogIndex);
        
        if (!redirectUrl) redirectUrl = "/blogs/";
    }

    // Build docs
    if (hasDocs && docDir) {
        const docFiles = fs.readdirSync(docDir, { recursive: true })
            .filter((f): f is string => typeof f === "string" && (f.endsWith(".md") || f.endsWith(".mdx")))
            .map((file) => path.join(docDir, file));
        
        console.log('No. of doc pages identified:', docFiles.length);

        const docs = await buildSection('doc', sourceDir, outputDir, docFiles, isRelease, inscribe, navState);

        await fs.ensureDir(path.join(outputDir, "docs"));
        let docIndex = renderSectionIndexPage('doc', docs, inscribe, sourceDir, navState);
        if (isRelease) docIndex = await minifyHtml(docIndex);
        await fs.writeFile(path.join(outputDir, "docs", "index.html"), docIndex);

        if (!redirectUrl) redirectUrl = "/docs/";
    }

    // Generate index.html
    let indexPage = "";
    if (hasHome) {
        indexPage = renderHomePage(inscribe, sourceDir, navState);
    } else if (redirectUrl) {
        indexPage = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${redirectUrl}"></head><body>Redirecting...</body></html>`;
    } else {
        indexPage = `<!DOCTYPE html><html><body>No content available.</body></html>`;
    }

    if (isRelease && hasHome) {
        indexPage = await minifyHtml(indexPage);
    }

    await fs.writeFile(path.join(outputDir, "index.html"), indexPage);
}
