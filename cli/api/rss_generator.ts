import { Blog } from "../schemas/blog";
import { InscribeConfig } from "../schemas/inscribe";

export function generateRSS(blogs: Blog[], config: InscribeConfig): string {
    const rssItems = blogs.map(blog => {
        const postUrl = normalizeUrl((blog as any).url, config);
        const pubDate = new Date(blog.metadata.date).toUTCString();
        const description = blog.metadata.description || "";
        const image = blog.metadata.cover ? normalizeUrl(blog.metadata.cover, config) : "";

        return `
        <item>
            <title><![CDATA[${blog.metadata.title}]]></title>
            <link>${postUrl}</link>
            <guid isPermaLink="true">${postUrl}</guid>
            <pubDate>${pubDate}</pubDate>
            <description><![CDATA[${description}]]></description>
            ${image ? `<media:content url="${image}" medium="image" />` : ""}
            ${image ? `<enclosure url="${image}" length="0" type="image/jpeg" />` : ""}
        </item>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
    <title><![CDATA[${config.title || "Inscribe Blog"}]]></title>
    <link>${normalizeUrl("", config)}</link>
    <description><![CDATA[${config.tagline || ""}]]></description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${normalizeUrl("/rss.xml", config)}" rel="self" type="application/rss+xml" />
    ${rssItems}
</channel>
</rss>`;
}

export function normalizeUrl(url: string, config: InscribeConfig) {
    if (url.startsWith('http')) return url;
    let base = config.base_url || '/';
    if (!base.endsWith('/')) base += '/';
    const suffix = url.startsWith('/') ? url.slice(1) : url;
    return base + suffix;
}
