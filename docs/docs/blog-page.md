---
title: Blog Page
weight: 2
author: Inscribe Team
date: 2026-03-13
slug: advanced-blog-page
---

# Blog Pages

Inscribe supports high-quality blog posts with automatic pagination and indexing.

## Creating a Blog Post

Place your markdown files in the directory specified by `blog_path` in `inscribe.yaml` (default is `blogs/`).

## Blog Metadata

Every blog post can include a variety of metadata fields at the top of the file, between `---` markers. These fields control how the blog post is displayed in listings and on the page itself.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | **Required** | The title of the blog post. |
| `author` | **Required** | The name of the author. |
| `date` | **Required** | The publication date (e.g., `2024-03-14`). |
| `slug` | **Required** | The URL-friendly identifier for the post. |
| `description`| Optional | A brief summary shown in blog listings. |
| `cover` | Optional | URL to a hero/cover image for the post. |
| `cover_alt` | Optional | Alt text for the cover image (also used as a caption). |
| `tags` | Optional | A comma-separated list of tags (e.g., `news, update`). |
| `weight` | Optional | Numeric weight for sorting (lower values appear first). Defaults to `0`. |
| `showToc` | Optional | Boolean (`true`/`false`) to show a Table of Contents. Defaults to `false`. |
| `draft` | Optional | Boolean (`true`/`false`). If `true`, the post is hidden in production. |

### Example

Here is an example showing how to leverage different metadata for a styled blog post:

```yaml
---
title: "The Future of Web Design: Glassmorphism and Beyond"
author: "Alex Rivers"
date: 2026-03-14
slug: future-of-web-design
description: "Exploring the next generation of digital aesthetics, from glassmorphism to dynamic micro-animations."
cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
cover_alt: "A beautiful abstract glass-like background with vibrant colors."
tags: "design, trends, 2026, web"
weight: 10
showToc: true
draft: false
---
```
