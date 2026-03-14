import fs from "fs-extra";
import path from "path";
import { parseBlogPost, renderSectionPage, renderSectionIndexPage, renderHomePage, NavState } from "./renderer";
import { readInscribeFile } from "./inscribe_reader";
import { parseFolderMetadata } from "../utils/markdown";
import { Blog } from "../schemas/blog";

export const LocalServer = (sourceDir: string, isDev: boolean = false, port = 3000) => {
    return {
        port: port,
        async fetch(req: Request, server: any) {
            const url = new URL(req.url);

            // Handle WebSocket upgrade
            if (isDev && url.pathname === "/_reload") {
                const success = server.upgrade(req);
                if (success) return undefined;
            }

            // Read inscribe config
            const inscribe = await readInscribeFile(sourceDir);
            if (isDev) {
                inscribe.base_url = "/";
            }

            const blogPath = inscribe.blog_path === "null" || !inscribe.blog_path ? null : inscribe.blog_path;
            const docPath = inscribe.doc_path === "null" || !inscribe.doc_path ? null : inscribe.doc_path;
            const blogDir = blogPath ? path.join(sourceDir, blogPath) : null;
            const docDir = docPath ? path.join(sourceDir, docPath) : null;

            const hasBlog = blogDir ? fs.existsSync(blogDir) : false;
            const hasDocs = docDir ? fs.existsSync(docDir) : false;
            const hasHome = inscribe.show_home !== false;
            const navState: NavState = { hasHome, hasBlog, hasDocs };

            // Helper: collect relative .md/.mdx file paths under a directory
            const getFiles = (dir: string | null): string[] =>
                dir && fs.existsSync(dir)
                    ? (fs.readdirSync(dir, { recursive: true }) as string[]).filter(
                          (f) => f.endsWith(".md") || f.endsWith(".mdx")
                      )
                    : [];

            // Helper: parse all posts in a directory, attaching relativePath and sorting
            const getAllPosts = async (dir: string, files: string[], singularFolder: string): Promise<Blog[]> => {
                const posts = await Promise.all(
                    files
                        .filter((f) => !f.endsWith("index.md"))
                        .map(async (f) => {
                            const post = await parseBlogPost(path.join(dir, f));
                            const relativePath = f.replace(/\\/g, '/');
                            const relativeDir = path.dirname(relativePath).replace(/\\/g, '/');
                            const dirPrefix = relativeDir === '.' ? '' : relativeDir + '/';
                            
                            (post as any).relativePath = relativePath;
                            (post as any).relativeDir = relativeDir === '.' ? '' : relativeDir;
                            (post as any).url = `/${singularFolder}/${dirPrefix}${post.metadata.slug}`;
                            return post;
                        })
                );
                return posts.sort((a, b) => {
                    const wA = a.metadata.weight ?? 0;
                    const wB = b.metadata.weight ?? 0;
                    if (wA !== wB) return wA - wB;
                    return a.metadata.slug.localeCompare(b.metadata.slug);
                });
            };

            // Helper: build folder-metadata map from index.md files
            const getFolderMetadata = (dir: string, files: string[]): Record<string, any> => {
                const meta: Record<string, any> = {};
                for (const f of files) {
                    if (f.endsWith("index.md")) {
                        const absDir = path.dirname(path.join(dir, f));
                        const relDir = path.relative(dir, absDir);
                        meta[relDir.replace(/\\/g, '/') || ''] = parseFolderMetadata(absDir);
                    }
                }
                return meta;
            };

            const blogFiles = getFiles(blogDir);
            const docFilesRaw = getFiles(docDir);

            // Home page
            if (url.pathname === "/") {
                if (hasHome) {
                    const html = renderHomePage(inscribe, sourceDir, navState, isDev);
                    return new Response(html, { headers: { "Content-Type": "text/html" } });
                }
                const redirectUrl = hasBlog ? "/blogs/" : hasDocs ? "/docs/" : "";
                if (redirectUrl) return Response.redirect(`http://${url.host}${redirectUrl}`, 302);
                return new Response("No content available", { status: 404 });
            }

            // Blogs index
            if ((url.pathname === "/blogs" || url.pathname === "/blogs/") && hasBlog && blogDir) {
                const blogs = await getAllPosts(blogDir, blogFiles, 'blog');
                const html = renderSectionIndexPage('blog', blogs, {}, inscribe, sourceDir, navState, isDev);
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            }

            // Docs index
            if ((url.pathname === "/docs" || url.pathname === "/docs/") && hasDocs && docDir) {
                const docs = await getAllPosts(docDir, docFilesRaw, 'doc');
                if (docs.length > 0) {
                    const firstLevelDoc = docs.find(p => !(p as any).relativeDir);
                    const firstDoc = firstLevelDoc || docs[0];
                    return Response.redirect(`http://${url.host}${(firstDoc as any).url}`, 302);
                }
                const docFolderMetadata = getFolderMetadata(docDir, docFilesRaw);
                const html = renderSectionIndexPage('doc', docs, docFolderMetadata, inscribe, sourceDir, navState, isDev);
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            }

            // Blog page — match by pre-calculated URL
            if (url.pathname.startsWith("/blog/") && blogDir) {
                const pathName = url.pathname.replace(/\/$/, "");
                const blogs = await getAllPosts(blogDir, blogFiles, 'blog');
                const blog = blogs.find((p) => (p as any).url === pathName);
                if (blog) {
                    const fullHtml = await renderSectionPage('blog', blog, blogs, {}, inscribe, sourceDir, navState, isDev);
                    return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
                }
            }

            // Doc page — match by pre-calculated URL
            if (url.pathname.startsWith("/doc/") && docDir) {
                const pathName = url.pathname.replace(/\/$/, "");
                const docs = await getAllPosts(docDir, docFilesRaw, 'doc');
                const docFolderMetadata = getFolderMetadata(docDir, docFilesRaw);
                const doc = docs.find((p) => (p as any).url === pathName);
                if (doc) {
                    const fullHtml = await renderSectionPage('doc', doc, docs, docFolderMetadata, inscribe, sourceDir, navState, isDev);
                    return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
                }
            }

            // Static files — serve if file exists in sourceDir
            const relativePath = url.pathname.slice(1);
            if (relativePath) {
                const staticFilePath = path.join(sourceDir, relativePath);
                if (fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
                    const file = Bun.file(staticFilePath);
                    return new Response(file);
                }
            }

            return new Response("Not Found", { status: 404 });
        },
        websocket: {
            message(ws: any, message: string) { },
            open(ws: any) {
                ws.subscribe("reload");
            },
            close(ws: any) {
                ws.unsubscribe("reload");
            },
        },
    }
}


