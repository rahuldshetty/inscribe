import fs from "fs-extra";
import path from "path";
import { marked } from "marked";
import { parseFrontMatter } from "../utils/markdown";

export const LocalServer = (blogDir: string) => {
    return {
        port: 3000,
        async fetch(req: Request) {
            const url = new URL(req.url);
            const files = fs.readdirSync(blogDir).filter(f => f.endsWith(".md"));

            // Home page: List all blogs
            if (url.pathname === "/") {
                const posts = files.map(file => {
                    const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
                    const { data } = parseFrontMatter(content);
                    const slug = file.replace(".md", "");
                    return `<li><a href="/blog/${slug}">${data.title || slug}</a></li>`;
                }).join("");

                return new Response(`
                        <html>
                            <head><title>Inscribe Dev Server</title></head>
                            <body>
                                <h1>Blog Posts</h1>
                                <ul>${posts}</ul>
                            </body>
                        </html>
                    `, { headers: { "Content-Type": "text/html" } });
            }

            // Blog page: Render specific blog
            if (url.pathname.startsWith("/blog/")) {
                const slug = url.pathname.replace("/blog/", "");
                const fileName = `${slug}.md`;
                const filePath = path.join(blogDir, fileName);

                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, "utf-8");
                    const { data, body } = parseFrontMatter(content);
                    const html = marked(body);

                    return new Response(`
                            <html>
                                <head><title>${data.title || slug}</title></head>
                                <body>
                                    <a href="/">← Back</a>
                                    <h1>${data.title || slug}</h1>
                                    <p>By ${data.author || "Unknown"} on ${data.date || "Unknown"}</p>
                                    <hr />
                                    <article>${html}</article>
                                </body>
                            </html>
                        `, { headers: { "Content-Type": "text/html" } });
                }
            }

            return new Response("Not Found", { status: 404 });
        },
    }
}


