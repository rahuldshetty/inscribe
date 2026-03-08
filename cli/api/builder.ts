import fs from "fs-extra";
import path from "path";
import { marked } from "marked";
import { parseFrontMatter } from "../utils/markdown";
import { minifyHtml } from "../utils/minifier";

export interface BuildOptions {
    sourceDir: string;
    outputDir: string;
    env: string;
}

export async function build(options: BuildOptions) {
    const { sourceDir, outputDir, env } = options;
    const blogDir = path.join(sourceDir, "blog");
    const isRelease = env === "release";

    if (!fs.existsSync(blogDir)) {
        throw new Error(`'blog' directory not found in ${sourceDir}`);
    }

    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(outputDir, "blog"));

    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));
    const postsMetadata: any[] = [];

    for (const file of files) {
        const filePath = path.join(blogDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const { data, body } = parseFrontMatter(content);
        const htmlContent = marked(body);
        const slug = file.replace(".md", "");

        postsMetadata.push({
            slug,
            title: data.title || slug,
            author: data.author || "Unknown",
            date: data.date || "Unknown",
        });

        let html = `
            <html>
                <head><title>${data.title || slug}</title></head>
                <body>
                    <a href="/">← Back</a>
                    <h1>${data.title || slug}</h1>
                    <p>By ${data.author || "Unknown"} on ${data.date || "Unknown"}</p>
                    <hr />
                    <article>${htmlContent}</article>
                </body>
            </html>
        `;

        if (isRelease) {
            html = await minifyHtml(html);
        }

        await fs.writeFile(path.join(outputDir, "blog", `${slug}.html`), html);
    }

    // Generate index.html
    const postsHtml = postsMetadata
        .map((post) => `<li><a href="/blog/${post.slug}.html">${post.title}</a></li>`)
        .join("");

    let indexHtml = `
        <html>
            <head><title>Inscribe Blog</title></head>
            <body>
                <h1>Blog Posts</h1>
                <ul>${postsHtml}</ul>
            </body>
        </html>
    `;

    if (isRelease) {
        indexHtml = await minifyHtml(indexHtml);
    }

    await fs.writeFile(path.join(outputDir, "index.html"), indexHtml);
}
