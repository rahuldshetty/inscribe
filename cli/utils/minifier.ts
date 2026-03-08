import { minify } from "html-minifier-terser";

/**
 * Robust HTML minifier using html-minifier-terser.
 * @param html The HTML string to minify.
 * @returns The minified HTML string.
 */
export async function minifyHtml(html: string): Promise<string> {
    return await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true,
        caseSensitive: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
    });
}
