import fs from "fs-extra";
import path from "path";
import { parseBlogPost, renderBlogPage, renderIndexPage } from "./renderer";
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

            const blogDir = path.join(sourceDir, "blog");
            if (!fs.existsSync(blogDir)) {
                console.log('WARNING: blog directory not found.');
            }
            const files = fs.readdirSync(blogDir, {
                recursive: true
            }).filter((f): f is string => typeof f === "string" && f.endsWith(".md"));

            const slug2index: Record<string, number> = {};

            // Read inscribe config
            const inscribe = await readInscribeFile(sourceDir);

            const blogs = await Promise.all(files.map(async (file, index) => {
                const filePath = path.join(blogDir, file);
                const blog = await parseBlogPost(filePath);
                slug2index[blog.metadata.slug] = index;
                return blog;
            }));

            // Home page: List all blogs
            if (url.pathname === "/") {
                const html = renderIndexPage(blogs, inscribe, isDev);
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            }

            // Blog page: Render specific blog
            if (url.pathname.startsWith("/blog/")) {
                const slug = url.pathname.replace("/blog/", "");
                const blog = blogs[slug2index[slug]];
                const fullHtml = await renderBlogPage(blog, inscribe, isDev);
                return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
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


