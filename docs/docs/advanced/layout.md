---
title: Layout
weight: 5
author: Inscribe Team
date: 2026-03-13
slug: advanced-layout
---

# Layouts

Inscribe uses the **Nunjucks** templating engine, allowing for powerful inheritance and modular design.

## Available Templates

The following built-in layouts are available in the framework:

| Template         | Description                                                                                                 |
| :--------------- | :---------------------------------------------------------------------------------------------------------- |
| `base.njk`       | The core skeleton that includes the `<head>`, global navigation, and footer. All other layouts extend this. |
| `home.njk`       | The landing page layout. Minimal and focused on the hero section.                                           |
| `blog.njk`       | Used for single blog post pages. Includes author metadata and tag capsules.                                 |
| `blog_index.njk` | The listing page for all your blog posts, featuring excerpts and cover thumbnails.                          |
| `doc.njk`        | The primary layout for documentation pages. It includes the hierarchical sidebar navigation.                |
| `doc_index.njk`  | A section landing page for documentation folders.                                                           |

## Template Inheritance

Inscribe layouts follow a "Master Page" pattern. Every specific layout (like `blog.njk` or `doc.njk`) starts with an inheritance tag:

```jinja
{% extends "base.njk" %}
```

This ensures that global elements like your theme CSS, site title, and navigation remain consistent across the entire site while only the content area changes.

## Customizing Layouts

You can override any built-in template by creating a file with the same name in your project's `layouts/` directory.

### Example: Custom Header Partial

Layouts often include "partials" from the `partials/` folder. To customize the header, you would typically override the partial instead of the entire layout:

1. Create `layouts/partials/header.njk` in your project.
2. Inscribe will automatically pick yours up over the built-in one during the build process.
