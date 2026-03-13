import * as z from "zod";

export const BlogMetadataSchema = z.object({
    title: z.string(),
    author: z.string(),
    date: z.string(),
    slug: z.string(),
    draft: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()).default(true),
    description: z.string().default("").optional(),
    cover: z.string().default("").optional(),
    cover_alt: z.string().default("").optional(),
    tags: z.string().transform(val => val.split(",").map(t => t.trim())).optional(),
    showToc: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()).default(false),
    weight: z.number().default(0).optional(),
});

export const BlogScehma = z.object({
    metadata: BlogMetadataSchema,
    markdown: z.string(),
    isMDX: z.boolean().default(false),
})

export type Blog = z.infer<typeof BlogScehma>;
