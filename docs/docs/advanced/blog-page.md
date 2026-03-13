---
title: Blog Page
weight: 1
author: Inscribe Team
date: 2026-03-13
slug: advanced-blog-page
---

# Blog Pages

Inscribe supports high-quality blog posts with automatic pagination and indexing.

## Creating a Blog Post

Place your markdown files in the directory specified by `blog_path` in `inscribe.yaml` (default is `blogs/`).

### Front Matter

Every blog post should have front matter:

```yaml
---
title: My First Post
date: 2024-03-13
author: Jane Doe
tags: [news, update]
---
```

## Disabling Blogs

If you don't need a blog, set `blog_path: ""` in your `inscribe.yaml`.
