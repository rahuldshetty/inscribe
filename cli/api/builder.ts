import fs from "fs-extra";
import path from "path";
import { minifyHtml } from "../utils/minifier";
import { parseBlogPost, renderBlogPage, renderIndexPage } from "./renderer";

export interface BuildOptions {
    sourceDir: string;
    outputDir: string;
    env: string;
}

const buildBlog = async (
    blogDir: string,
    outputDir: string,
    files: string[],
    isRelease: boolean,
) => {
    const postsMetadata: any[] = [];

    for (const filePath of files) {
        const { data, html, slug } = await parseBlogPost(filePath);
        let fullHtml = renderBlogPage(data, html, slug);

        postsMetadata.push({
            title: data.title || slug,
            slug,
            date: data.date,
            isStatic: true
        });

        if (isRelease) {
            fullHtml = await minifyHtml(fullHtml);
        }

        await fs.writeFile(path.join(outputDir, "blog", `${slug}.html`), fullHtml);
    }

    return postsMetadata;
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

    // Build blog files
    const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md")).map((file) => path.join(blogDir, file));

    const postsMetadata = await buildBlog(
        blogDir,
        outputDir,
        blogFiles,
        isRelease
    );

    // Generate index.html
    let indexHtml = renderIndexPage(postsMetadata);

    if (isRelease) {
        indexHtml = await minifyHtml(indexHtml);
    }

    await fs.writeFile(path.join(outputDir, "index.html"), indexHtml);
}
