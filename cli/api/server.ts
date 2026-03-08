import fs from "fs-extra";
import path from "path";
import { parseBlogPost, renderBlogPage, renderIndexPage } from "./renderer";

export const LocalServer = (blogDir: string) => {
    return {
        port: 3000,
        async fetch(req: Request) {
            const url = new URL(req.url);
            const files = fs.readdirSync(blogDir, {
                recursive: true
            }).filter((f): f is string => typeof f === "string" && f.endsWith(".md"));

            const slug2index: Record<string, number> = {};

            const blogs = await Promise.all(files.map(async (file, index) => {
                const filePath = path.join(blogDir, file);
                const blog = await parseBlogPost(filePath);
                slug2index[blog.metadata.slug] = index;
                return blog;
            }));

            // Home page: List all blogs
            if (url.pathname === "/") {
                const html = renderIndexPage(blogs);
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            }

            // Blog page: Render specific blog
            if (url.pathname.startsWith("/blog/")) {
                const slug = url.pathname.replace("/blog/", "");
                const blog = blogs[slug2index[slug]];
                const fullHtml = await renderBlogPage(blog);
                return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
            }

            return new Response("Not Found", { status: 404 });
        },
    }
}


