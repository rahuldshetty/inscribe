import fs from "fs-extra";
import { parse as yamlParse } from 'yaml';
import { InscribeSchema, InscribeConfig } from "../schemas/inscribe";
import path from "path";

export const readInscribeFile = async (rootDir: string): Promise<InscribeConfig> => {
    const filePath = path.join(rootDir, "inscribe.yaml");
    if (!fs.existsSync(filePath)) {
        return InscribeSchema.parse({});
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsedYaml = yamlParse(content);
    return InscribeSchema.parse(parsedYaml);
}
