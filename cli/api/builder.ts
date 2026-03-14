import fs from "fs-extra";
import path from "path";
import { minifyHtml } from "../utils/minifier";
import { parseBlogPost, renderSectionPage, renderSectionIndexPage, renderHomePage, NavState } from "./renderer";
import { Blog } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";
import { readInscribeFile } from "./inscribe_reader";
import { parseFolderMetadata } from "../utils/markdown";
import { FolderMetadata } from "../schemas/folder";

export interface BuildOptions {
    sourceDir: string;
    outputDir: string;
    env: string;
}

const normalizeUrl = (url: string, config: InscribeConfig) => {
    if (url.startsWith('http')) return url;
    let base = config.base_url || '/';
    if (!base.endsWith('/')) base += '/';
    const suffix = url.startsWith('/') ? url.slice(1) : url;
    return base + suffix;
}

const buildSection = async (
    type: 'blog' | 'doc',
    sourceDir: string,
    outputDir: string,
    files: string[],
    isRelease: boolean,
    inscribe: InscribeConfig,
    navState: NavState
): Promise<{ posts: Blog[]; folderMetadata: Record<string, FolderMetadata> }> => {
    const posts: Blog[] = [];
    const singularFolder = type === 'blog' ? 'blog' : 'doc';
    const sectionRoot = path.join(sourceDir, type === 'doc' ? (inscribe.doc_path || 'docs') : (inscribe.blog_path || 'blog'));

    await fs.ensureDir(path.join(outputDir, singularFolder));

    const folderMetadata: Record<string, FolderMetadata> = {};

    for (const filePath of files) {
        if (filePath.endsWith("index.md")) {
            const dir = path.dirname(filePath);
            const relativeDir = path.relative(sectionRoot, dir);
            folderMetadata[relativeDir || ''] = parseFolderMetadata(dir);
            continue;
        }

        const post = await parseBlogPost(filePath);
        (post as any).relativePath = path.relative(sectionRoot, filePath);
        posts.push(post);
    }

    posts.sort((a, b) => {
        const weightA = a.metadata.weight ?? 0;
        const weightB = b.metadata.weight ?? 0;
        if (weightA !== weightB) return weightA - weightB;
        return a.metadata.slug.localeCompare(b.metadata.slug);
    });

    for (const post of posts) {
        let fullHtml = await renderSectionPage(type, post, posts, folderMetadata, inscribe, sourceDir, navState);
        if (isRelease) fullHtml = await minifyHtml(fullHtml);
        await fs.writeFile(path.join(outputDir, singularFolder, `${post.metadata.slug}.html`), fullHtml);
    }

    return { posts, folderMetadata };
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

        const { posts: blogs } = await buildSection('blog', sourceDir, outputDir, blogFiles, isRelease, inscribe, navState);

        await fs.ensureDir(path.join(outputDir, "blogs"));
        let blogIndex = renderSectionIndexPage('blog', blogs, {}, inscribe, sourceDir, navState);
        if (isRelease) blogIndex = await minifyHtml(blogIndex);
        await fs.writeFile(path.join(outputDir, "blogs", "index.html"), blogIndex);

        if (!redirectUrl) redirectUrl = normalizeUrl("/blogs/", inscribe);
    }

    // Build docs
    if (hasDocs && docDir) {
        const docFiles = fs.readdirSync(docDir, { recursive: true })
            .filter((f): f is string => typeof f === "string" && (f.endsWith(".md") || f.endsWith(".mdx")))
            .map((file) => path.join(docDir, file));

        console.log('No. of doc pages identified:', docFiles.length);

        // folderMetadata is computed once inside buildSection and reused for the index page
        const { posts: docs, folderMetadata } = await buildSection('doc', sourceDir, outputDir, docFiles, isRelease, inscribe, navState);

        await fs.ensureDir(path.join(outputDir, "docs"));
        if (docs.length > 0) {
            const firstLevelDoc = docs.find(p => !((p as any).relativePath).includes('/') && !((p as any).relativePath).includes('\\'));
            const firstDocSlug = (firstLevelDoc || docs[0]).metadata.slug;
            const redirectHtml = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${normalizeUrl(`/doc/${firstDocSlug}`, inscribe)}"></head><body>Redirecting...</body></html>`;
            await fs.writeFile(path.join(outputDir, "docs", "index.html"), redirectHtml);
        }

        if (!redirectUrl) redirectUrl = normalizeUrl("/docs/", inscribe);
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

    // Copy static assets
    console.log("Copying static assets...");
    const excludedExtensions = [".md", ".mdx", ".njk", ".yaml", ".yml"];
    const excludedDirs = ["layouts", ".git", "node_modules"];

    const copyRecursive = async (src: string, dest: string) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                if (excludedDirs.includes(entry.name)) continue;
                await fs.ensureDir(destPath);
                await copyRecursive(srcPath, destPath);
            } else {
                if (excludedExtensions.includes(path.extname(entry.name))) continue;
                if (entry.name === "inscribe.yaml" || entry.name === "inscribe.yml") continue;
                await fs.copy(srcPath, destPath);
            }
        }
    };

    await copyRecursive(sourceDir, outputDir);
}
