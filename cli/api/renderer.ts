import fs from "fs-extra";
import path from "path";
import { marked } from "marked";
import { parseFrontMatter } from "../utils/markdown";
import { BlogScehma } from "../schemas/blog";

export const parseBlogPost = async (filePath: string) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, body } = parseFrontMatter(content);

    // Validate with Zod
    const validated = BlogScehma.parse({
        metadata: data,
        markdown: body
    });

    const html = await marked(validated.markdown);
    const slug = path.basename(filePath, ".md");

    return {
        data: validated.metadata,
        html,
        slug
    };
};

export const renderBlogPage = (data: any, html: string, slug: string) => {
    return `
        <html>
            <head>
                <title>${data.title || slug}</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
                    a { color: #0070f3; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <nav><a href="/">← Back to Home</a></nav>
                <header>
                    <h1>${data.title || slug}</h1>
                    <p>By ${data.author || "Unknown"} on ${data.date || "Unknown"}</p>
                </header>
                <hr />
                <article>${html}</article>
            </body>
        </html>
    `;
};

export const renderIndexPage = (posts: any[]) => {
    const postsHtml = posts.map(post => `
        <li>
            <a href="/blog/${post.slug}${post.isStatic ? '.html' : ''}">${post.title}</a>
            <span style="color: #666; font-size: 0.9rem;"> - ${post.date || 'No date'}</span>
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
            </body>
        </html>
    `;
};
