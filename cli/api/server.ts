import fs from "fs-extra";
import path from "path";
import { parseBlogPost, renderBlogPage, renderIndexPage } from "./renderer";

export const LocalServer = (blogDir: string) => {
    return {
        port: 3000,
        async fetch(req: Request) {
            const url = new URL(req.url);
            const files = fs.readdirSync(blogDir).filter(f => f.endsWith(".md"));

            // Home page: List all blogs
            if (url.pathname === "/") {
                const posts = await Promise.all(files.map(async file => {
                    const filePath = path.join(blogDir, file);
                    const { data, slug } = await parseBlogPost(filePath);
                    return {
                        title: data.title || slug,
                        slug,
                        date: data.date,
                        isStatic: false
                    };
                }));

                const html = renderIndexPage(posts);
                return new Response(html, { headers: { "Content-Type": "text/html" } });
            }

            // Blog page: Render specific blog
            if (url.pathname.startsWith("/blog/")) {
                const slug = url.pathname.replace("/blog/", "");
                const fileName = `${slug}.md`;
                const filePath = path.join(blogDir, fileName);

                if (fs.existsSync(filePath)) {
                    const { data, html } = await parseBlogPost(filePath);
                    const fullHtml = renderBlogPage(data, html, slug);
                    return new Response(fullHtml, { headers: { "Content-Type": "text/html" } });
                }
            }

            return new Response("Not Found", { status: 404 });
        },
    }
}


