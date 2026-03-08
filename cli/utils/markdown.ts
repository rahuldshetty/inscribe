export function parseFrontMatter(content: string) {
    const regex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
    const match = content.match(regex);
    if (!match) return { data: {}, body: content };

    const yamlStr = match[1];
    const body = match[2];
    const data: Record<string, string> = {};

    yamlStr.split("\n").forEach(line => {
        const [key, ...value] = line.split(":");
        if (key && value) {
            data[key.trim()] = value.join(":").trim().replace(/^["']|["']$/g, "");
        }
    });

    return { data, body };
}