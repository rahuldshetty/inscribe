import fs from "fs-extra";
import path from "path";
import { minifyHtml } from "../utils/minifier";
import { parseBlogPost, renderSectionPage, renderSectionIndexPage, renderHomePage, renderRedirectPage, NavState } from "./renderer";
import { Blog } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";
import { readInscribeFile } from "./inscribe_reader";
import { parseFolderMetadata } from "../utils/markdown";
import { FolderMetadata } from "../schemas/folder";
import { generateRSS, normalizeUrl } from "./rss_generator";

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
        const relativePath = path.relative(sectionRoot, filePath);
        const relativeDir = path.dirname(relativePath).replace(/\\/g, '/');
        const dirPrefix = relativeDir === '.' ? '' : relativeDir + '/';
        
        (post as any).relativePath = relativePath;
        (post as any).relativeDir = relativeDir === '.' ? '' : relativeDir;
        (post as any).url = `/${singularFolder}/${dirPrefix}${post.metadata.slug}`;
        
        // Filter out drafts for build command (where isRelease is true or false but we are in builder)
        // Actually, the requirement says "For builds do not show draft blog pages, but it is okay to show it for 'dev' command".
        // builder.ts is used by the build command. server.ts is used by the dev command.
        if (type === 'blog' && post.metadata.draft) {
            continue;
        }

        posts.push(post);
    }

    posts.sort((a, b) => {
        if (type === 'blog') {
            const dateA = new Date(a.metadata.date || 0).getTime();
            const dateB = new Date(b.metadata.date || 0).getTime();
            if (dateA !== dateB) return dateB - dateA; // Descending order
        }

        const weightA = a.metadata.weight ?? 0;
        const weightB = b.metadata.weight ?? 0;
        if (weightA !== weightB) return weightA - weightB;
        return a.metadata.slug.localeCompare(b.metadata.slug);
    });

    for (const post of posts) {
        let fullHtml = await renderSectionPage(type, post, posts, folderMetadata, inscribe, sourceDir, navState);
        if (isRelease) fullHtml = await minifyHtml(fullHtml);
        
        const outDir = path.join(outputDir, singularFolder, (post as any).relativeDir);
        await fs.ensureDir(outDir);
        await fs.writeFile(path.join(outDir, `${post.metadata.slug}.html`), fullHtml);
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

        // Generate RSS feed
        const rssFeed = generateRSS(blogs, inscribe);
        await fs.writeFile(path.join(outputDir, "rss.xml"), rssFeed);
        console.log("RSS feed generated at rss.xml");
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
            const firstLevelDoc = docs.find(p => !(p as any).relativeDir);
            const firstDoc = firstLevelDoc || docs[0];
            const redirectHtml = renderRedirectPage(normalizeUrl((firstDoc as any).url, inscribe));
            await fs.writeFile(path.join(outputDir, "docs", "index.html"), redirectHtml);
        }

        if (!redirectUrl) redirectUrl = normalizeUrl("/docs/", inscribe);
    }

    // Generate index.html
    let indexPage = "";
    if (hasHome) {
        indexPage = renderHomePage(inscribe, sourceDir, navState);
    } else if (redirectUrl) {
        indexPage = renderRedirectPage(redirectUrl);
    } else {
        indexPage = `<!DOCTYPE html><html><body>No content available.</body></html>`;
    }

    if (isRelease && hasHome) {
        indexPage = await minifyHtml(indexPage);
    }

    await fs.writeFile(path.join(outputDir, "index.html"), indexPage);

    // Copy static assets
    const staticDir = path.join(sourceDir, "static");
    if (fs.existsSync(staticDir)) {
        console.log("Copying static assets from:", staticDir);
        await fs.copy(staticDir, path.join(outputDir, "static"));
    }

    // Generate static Tailwind CSS for release builds
    if (isRelease) {
        const { generateTailwind } = await import("../utils/tailwind");
        await generateTailwind(outputDir, path.join(outputDir, "static"));
    }
}

