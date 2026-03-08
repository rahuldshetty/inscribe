#! /usr/bin/env bun
import { Cli, defineCommand } from "clerc";
import fs from "fs-extra";
import path from "path";
import { marked } from "marked";
import { parseFrontMatter } from "./utils/markdown";
import { LocalServer } from "./server";

const templateDir = path.resolve(__dirname, "../template")

const cli = Cli({
    name: "inscribe",
    scriptName: "inscribe",
    description: "A simple static website generator for blogs and portfolio.",
    version: "0.0.1",
});

const initCommand = defineCommand(
    {
        name: "init",
        description: "Create scaffold for blog/docs",
    },
    async (ctx) => {
        const target = process.cwd();
        // check whether target is empty
        if (fs.readdirSync(target).length > 0) {
            console.log("Target directory is not empty");
            return;
        }
        await fs.copy(templateDir, target, {
            overwrite: false,
        });
        console.log("Docs scaffold created");
    }
);

const devCommand = defineCommand(
    {
        name: "dev",
        description: "Run development server",
        parameters: [
            "[path]",
        ],
    },
    async (ctx) => {
        const sourceDir = path.resolve(process.cwd(), ctx.parameters.path || ".");
        const blogDir = path.join(sourceDir, "blog");

        if (!fs.existsSync(blogDir)) {
            console.error(`Error: 'blog' directory not found in ${sourceDir}`);
            return;
        }

        console.log(`Starting dev server for: ${sourceDir}`);

        const server = Bun.serve(LocalServer(blogDir));

        console.log(`Server running at http://localhost:${server.port}`);
    }
);

const buildCommand = defineCommand(
    {
        name: "build",
        description: "Build static website",
        parameters: ["[path]"],
        flags: {
            output: {
                type: String,
                alias: "o",
                default: "./dist",
                description: "Output directory",
            },
            env: {
                type: String,
                default: "release",
                description: "Build environment (dev or release)",
            },
        },
    },
    async (ctx) => {
        const sourceDir = path.resolve(process.cwd(), ctx.parameters.path || ".");
        const blogDir = path.join(sourceDir, "blog");
        const outputDir = path.resolve(process.cwd(), ctx.flags.output);
        const isRelease = ctx.flags.env === "release";

        if (!fs.existsSync(blogDir)) {
            console.error(`Error: 'blog' directory not found in ${sourceDir}`);
            return;
        }

        console.log(`Building static site from: ${blogDir}`);
        console.log(`Output directory: ${outputDir}`);
        console.log(`Environment: ${ctx.flags.env}`);

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
                // Simple minification
                html = html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
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
            // Simple minification
            indexHtml = indexHtml.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
        }

        await fs.writeFile(path.join(outputDir, "index.html"), indexHtml);

        console.log("Build completed successfully!");
    }
);


cli.command(initCommand);
cli.command(devCommand);
cli.command(buildCommand);

// Parse arguments and run!
cli.parse(); 
