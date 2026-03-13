import * as z from "zod";

export const FolderMetadataSchema = z.object({
    title: z.string().optional(),
    weight: z.number().default(0).optional(),
});

export type FolderMetadata = z.infer<typeof FolderMetadataSchema>;
