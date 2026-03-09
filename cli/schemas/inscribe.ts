import * as z from "zod";

export const InscribeSchema = z.object({
    title: z.string().default('Inscribe').optional(),
    tagline: z.string().default('Inscribe Blog').optional(),
    favicon: z.string().default('favicon.ico').optional(),

})

export type InscribeConfig = z.infer<typeof InscribeSchema>;
