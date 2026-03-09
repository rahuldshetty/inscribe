import fs from "fs-extra";
import path from "path";
import { minifyHtml } from "../utils/minifier";
import { parseBlogPost, renderBlogPage, renderIndexPage } from "./renderer";
import { Blog } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";
import { readInscribeFile } from "./inscribe_reader";

export interface BuildOptions {
    sourceDir: string;
    outputDir: string;
    env: string;
}

const buildBlog = async (
    outputDir: string,
    files: string[],
    isRelease: boolean,
    inscribe: InscribeConfig,
) => {
    const blogs: Blog[] = [];

    for (const filePath of files) {
        const blog = await parseBlogPost(filePath);
        let fullHtml = await renderBlogPage(blog, inscribe);

        blogs.push(blog);

        if (isRelease) {
            fullHtml = await minifyHtml(fullHtml);
        }

        await fs.writeFile(path.join(outputDir, "blog", `${blog.metadata.slug}.html`), fullHtml);
    }

    return blogs;
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


    // Read inscribe config
    const inscribe = await readInscribeFile(sourceDir);

    // Build blog files
    const blogFiles = fs.readdirSync(blogDir, {
        recursive: true,
    }).filter((f): f is string => typeof f === "string" && (f.endsWith(".md") || f.endsWith(".mdx"))
    ).map((file) => path.join(blogDir, file));
    console.log('No. of blog pages identified:', blogFiles.length);

    const blogs = await buildBlog(
        outputDir,
        blogFiles,
        isRelease,
        inscribe
    );

    // Generate index.html
    let indexPage = renderIndexPage(blogs, inscribe);

    if (isRelease) {
        indexPage = await minifyHtml(indexPage);
    }

    await fs.writeFile(path.join(outputDir, "index.html"), indexPage);
}
