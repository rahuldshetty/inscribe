import * as z from "zod";

export const InscribeSchema = z.object({
    title: z.string().default('Inscribe').optional(),
    tagline: z.string().default('Inscribe Blog').optional(),
    favicon: z.string().default('favicon.ico').optional(),
    theme: z.string().default('default'),
    show_home: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()).default(true),
    blog_path: z.string().default('blog').optional(),
    doc_path: z.string().default('docs').optional(),
    show_doc_nav: z.preprocess((val) => (typeof val === "string" ? val.toLowerCase() === "true" : val), z.boolean()).default(true).optional(),
    base_url: z.string().default('/').optional(),
    google_analytics_id: z.string().default('').optional(),
})

export type InscribeConfig = z.infer<typeof InscribeSchema>;
