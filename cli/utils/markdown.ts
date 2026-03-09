import { marked } from "marked";
import { parse as yamlParse } from "yaml";
import { compile, run } from "@mdx-js/mdx";
import * as jsxRuntime from "preact/jsx-runtime"
import render from "preact-render-to-string"

export function parseFrontMatter(content: string) {
    const regex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
    const match = content.match(regex);
    if (!match) return { data: {}, body: content };

    const yamlStr = match[1];
    const body = match[2];
    
    try {
        const data = yamlParse(yamlStr);
        return { data: data || {}, body };
    } catch (e) {
        // Fallback to manual parsing for "invalid" YAML with nested quotes
        const data: Record<string, any> = {};
        yamlStr.split(/\r?\n/).forEach(line => {
            const index = line.indexOf(":");
            if (index !== -1) {
                const key = line.slice(0, index).trim();
                const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
                if (key) data[key] = value;
            }
        });
        return { data, body };
    }
}

export const markdown2HTML = async (content: string, isMDX: boolean = false) => {
    if (isMDX) {
        try {
            // compile MDX -> JS
            const compiled = await compile(content, { 
                outputFormat: "function-body",
                development: false 
            });

            // execute compiled module
            const { default: Content } = await run(compiled, jsxRuntime);
            
            // render html
            const html = render(Content({}));

            return html;
        } catch (e) {
            console.error("MDX compilation error:", e);
            return await marked(content);
        }
    }
    const html = await marked(content)
    return html;
}
