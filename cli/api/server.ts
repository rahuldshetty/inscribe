import fs from "fs-extra";
import path from "path";
import { parseBlogPost, renderSectionPage, renderSectionIndexPage, renderHomePage, NavState } from "./renderer";
import { readInscribeFile } from "./inscribe_reader";

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

            const blogPath = inscribe.blog_path === "null" || !inscribe.blog_path ? null : inscribe.blog_path;
            const docPath = inscribe.doc_path === "null" || !inscribe.doc_path ? null : inscribe.doc_path;
            const blogDir = blogPath ? path.join(sourceDir, blogPath) : null;
            const docDir = docPath ? path.join(sourceDir, docPath) : null;

            const hasBlog = blogDir ? fs.existsSync(blogDir) : false;
            const hasDocs = docDir ? fs.existsSync(docDir) : false;
            const hasHome = inscribe.show_home !== false;
            const navState: NavState = { hasHome, hasBlog, hasDocs };

            // Helper to get files
            const getFiles = (dir: string | null) => dir && fs.existsSync(dir) 
                ? fs.readdirSync(dir, { recursive: true }).filter((f): f is string => typeof f === "string" && (f.endsWith(".md") || f.endsWith(".mdx")))
                : [];

            const blogFiles = getFiles(blogDir);
            const docFiles = getFiles(docDir);

            // Home page
            if (url.pathname === "/") {
                if (hasHome) {
                    const html = renderHomePage(inscribe, sourceDir, navState, isDev);
                    return new Response(html, { headers: { "Content-Type": "text/html" } });
                } else {
                    let redirectUrl = hasBlog ? "/blogs/" : hasDocs ? "/docs/" : "";
                    if (redirectUrl) {
                        return Response.redirect(`http://${url.host}${redirectUrl}`, 302);
                    }
                    return new Response("No content available", { status: 404 });
                }
            }

            // Blogs index
            if (url.pathname === "/blogs" || url.pathname === "/blogs/") {
                if (hasBlog && blogDir) {
                    const blogs = await Promise.all(blogFiles.map(f => parseBlogPost(path.join(blogDir, f))));
                    const html = renderSectionIndexPage('blog', blogs, inscribe, sourceDir, navState, isDev);
                    return new Response(html, { headers: { "Content-Type": "text/html" } });
                }
            }

            // Docs index
            if (url.pathname === "/docs" || url.pathname === "/docs/") {
                if (hasDocs && docDir) {
                    const docs = await Promise.all(docFiles.map(f => parseBlogPost(path.join(docDir, f))));
                    const html = renderSectionIndexPage('doc', docs, inscribe, sourceDir, navState, isDev);
                    return new Response(html, { headers: { "Content-Type": "text/html" } });
                }
            }

            // Blog page
            if (url.pathname.startsWith("/blog/") && blogDir) {
                const slug = url.pathname.replace("/blog/", "");
                const matchedFile = blogFiles.find(f => f.includes(slug));
                if (matchedFile) {
                    const blog = await parseBlogPost(path.join(blogDir, matchedFile));
                    const fullHtml = await renderSectionPage('blog', blog, inscribe, sourceDir, navState, isDev);
                    return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
                }
            }

            // Doc page
            if (url.pathname.startsWith("/doc/") && docDir) {
                const slug = url.pathname.replace("/doc/", "");
                const matchedFile = docFiles.find(f => f.includes(slug));
                if (matchedFile) {
                    const doc = await parseBlogPost(path.join(docDir, matchedFile));
                    const fullHtml = await renderSectionPage('doc', doc, inscribe, sourceDir, navState, isDev);
                    return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
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


