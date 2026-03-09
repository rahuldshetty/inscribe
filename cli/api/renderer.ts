import fs from "fs-extra";
import path from "path";
import { marked } from "marked";
import { parseFrontMatter } from "../utils/markdown";
import { Blog, BlogScehma } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";

export const parseBlogPost = async (filePath: string) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, body } = parseFrontMatter(content);

    // Validate with Zod
    const validated = BlogScehma.parse({
        metadata: data,
        markdown: body
    });

    return validated;
};

export const renderBlogPage = async (blog: Blog, inscribe: InscribeConfig, isDev: boolean = false) => {
    const html = await marked(blog.markdown);

    const reloadScript = isDev ? `
        <script>
            const socket = new WebSocket("ws://" + location.host + "/_reload");
            socket.onmessage = (event) => {
                if (event.data === "reload") {
                    console.log("Reloading...");
                    location.reload();
                }
            };
            socket.onclose = () => {
                console.log("Reload connection closed. Retrying in 2s...");
                setTimeout(() => location.reload(), 2000);
            };
        </script>
    ` : "";

    return `
        <html>
            <head>
                <title>${inscribe.title} | ${blog.metadata.title}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
                    a { color: #0070f3; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .cover-container { margin-bottom: 2rem; }
                    .cover-image { width: 100%; height: auto; border-radius: 8px; }
                    .cover-alt { font-size: 0.9rem; color: #666; margin-top: 0.5rem; text-align: center; }
                    .tags { margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
                    .tag { background: #f0f0f0; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; color: #555; }
                    header h1 { margin-bottom: 0.5rem; }
                    .metadata { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <nav><a href="/">← Back to Home</a></nav>
                <header>
                    <h1>${blog.metadata.title}</h1>
                    <div class="metadata">
                        By ${blog.metadata.author || "Unknown"} on ${blog.metadata.date || "Unknown"}
                    </div>
                    ${blog.metadata.cover ? `
                        <div class="cover-container">
                            <img src="${blog.metadata.cover}" alt="${blog.metadata.title}" class="cover-image" />
                            ${blog.metadata.cover_alt ? `<div class="cover-alt">${blog.metadata.cover_alt}</div>` : ""}
                        </div>
                    ` : ""}
                    <div class="tags">
                        ${blog.metadata.tags?.map(tag => `<span class="tag">${tag}</span>`).join("")}
                    </div>
                </header>
                <hr />
                <article>${html}</article>
                ${reloadScript}
            </body>
        </html>
    `;
};

export const renderIndexPage = (blogs: Blog[], inscribe: InscribeConfig, isDev: boolean = false) => {
    const reloadScript = isDev ? `
        <script>
            const socket = new WebSocket("ws://" + location.host + "/_reload");
            socket.onmessage = (event) => {
                if (event.data === "reload") {
                    console.log("Reloading...");
                    location.reload();
                }
            };
            socket.onclose = () => {
                console.log("Reload connection closed. Retrying in 2s...");
                setTimeout(() => location.reload(), 2000);
            };
        </script>
    ` : "";

    const postsHtml = blogs.map(blog => `
        <li>
            <a href="/blog/${blog.metadata.slug}">${blog.metadata.title}</a>
            <span style="color: #666; font-size: 0.9rem;"> - ${blog.metadata.date || 'No date'}</span>
        </li>
    `).join("");

    return `
        <html>
            <head>
                <title>Inscribe Blog</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
                    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 1rem; padding: 0.5rem; border-radius: 4px; transition: background 0.2s; }
                    li:hover { background: #f9f9f9; }
                    a { color: #0070f3; text-decoration: none; font-weight: bold; font-size: 1.2rem; }
                </style>
            </head>
            <body>
                <header>
                    <h1>Blog Posts</h1>
                </header>
                <ul>${postsHtml}</ul>
                ${reloadScript}
            </body>
        </html>
    `;
};
