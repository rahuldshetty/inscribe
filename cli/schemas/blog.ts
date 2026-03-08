import * as z from "zod";

export const BlogMetadataSchema = z.object({
    title: z.string(),
    author: z.string(),
    date: z.string(),
    slug: z.string(),
    draft: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()),
    description: z.string(),
    cover: z.string(),
    showToc: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()),
});

export const BlogScehma = z.object({
    metadata: BlogMetadataSchema,
    markdown: z.string(),
})

export type Blog = z.infer<typeof BlogScehma>;
