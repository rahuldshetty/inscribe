import fs from "fs-extra";
import path from "path";

/**
 * Resolves a theme name to its CSS content.
 *
 * Priority:
 *   1. <sourceDir>/themes/<themeName>.css  (user override)
 *   2. <builtInThemesDir>/<themeName>.css  (built-in preset)
 *
 * Throws a descriptive error if neither location has the file.
 */
export const resolveThemeCSS = (themeName: string, sourceDir: string): string => {
    const userThemePath    = path.resolve(sourceDir, "themes", `${themeName}.css`);
    const builtInThemePath = path.resolve(__dirname, "../../template/themes", `${themeName}.css`);

    if (fs.existsSync(userThemePath)) {
        return fs.readFileSync(userThemePath, "utf-8");
    }

    if (fs.existsSync(builtInThemePath)) {
        return fs.readFileSync(builtInThemePath, "utf-8");
    }

    throw new Error(
        `Theme "${themeName}" not found.\n` +
        `  Checked: ${userThemePath}\n` +
        `  Checked: ${builtInThemePath}\n` +
        `  Place a "${themeName}.css" file in your project's "themes/" folder, or use a built-in theme name.`
    );
};
