import { spawnSync } from "child_process";
import path from "path";
import fs from "fs-extra";

/**
 * Generates a static Tailwind CSS file by scanning the output directory
 * and the user's source directory (for custom layout overrides).
 *
 * Uses Tailwind v4's @source directive instead of the deprecated --content
 * CLI flag (which was a v3 API and is silently ignored by v4).
 *
 * @param outputDir  The directory where built HTML files are located.
 * @param staticDir  The directory where the generated CSS should be placed.
 * @param sourceDir  The user's project source directory (scanned for custom layouts).
 */
export async function generateTailwind(outputDir: string, staticDir: string, sourceDir?: string) {
    const templateInputPath = path.resolve(__dirname, "../../template/tailwind.css");
    const outputPath = path.join(staticDir, "tailwind.css");

    console.log("Generating static Tailwind CSS...");

    // Ensure static directory exists
    await fs.ensureDir(staticDir);

    // Tailwind v4 uses @source directives — the --content CLI flag from v3 is ignored.
    // We build a temporary input CSS that @imports the real config and adds @source
    // entries for both the built HTML and any user layout overrides.
    const distGlob   = path.join(outputDir, "**/*.html").replace(/\\/g, '/');
    const sourceGlob = sourceDir
        ? path.join(sourceDir, "**/*.{njk,html,md,mdx}").replace(/\\/g, '/')
        : null;

    const templateImport = templateInputPath.replace(/\\/g, '/');
    const tempCssLines = [
        `@import "${templateImport}";`,
        `@source "${distGlob}";`,
    ];
    if (sourceGlob) {
        tempCssLines.push(`@source "${sourceGlob}";`);
    }

    const tempInputPath = path.join(staticDir, "_tw_input_tmp.css");
    await fs.writeFile(tempInputPath, tempCssLines.join("\n"));

    try {
        const result = spawnSync("bunx", [
            "tailwindcss",
            "-i", tempInputPath,
            "-o", outputPath,
            "--minify",
        ], {
            stdio: "inherit",
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: "production"
            }
        });

        if (result.error) {
            throw new Error(`Failed to run Tailwind CLI: ${result.error.message}`);
        }

        if (result.status !== 0) {
            throw new Error(`Tailwind CLI exited with status ${result.status}`);
        }
    } finally {
        // Always clean up the temp file
        await fs.remove(tempInputPath);
    }

    console.log(`Static Tailwind CSS generated at: ${outputPath}`);
}
