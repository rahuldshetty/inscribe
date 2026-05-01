import { spawnSync } from "child_process";
import path from "path";
import fs from "fs-extra";

/**
 * Generates a static Tailwind CSS file by scanning the output directory.
 * @param outputDir The directory where HTML files are located.
 * @param staticDir The directory where the generated CSS should be placed.
 */
export async function generateTailwind(outputDir: string, staticDir: string) {
    const inputPath = path.resolve(__dirname, "../../template/tailwind.css");
    const outputPath = path.join(staticDir, "tailwind.css");

    console.log("Generating static Tailwind CSS...");

    // Ensure static directory exists
    await fs.ensureDir(staticDir);

    // Run Tailwind CLI
    // We scan all HTML files in the output directory
    const result = spawnSync("npx", [
        "@tailwindcss/cli",
        "-i", inputPath,
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

    console.log(`Static Tailwind CSS generated at: ${outputPath}`);
}
