---
title: Layout
weight: 5
author: Inscribe Team
date: 2026-03-13
slug: advanced-layout
---

# Layouts

Inscribe uses Nunjucks for its templating engine.

## Default Layouts

Built-in layouts include:
- `base.njk`: The skeleton for all pages.
- `home.njk`: The home page layout.
- `doc.njk`: The layout for documentation pages.
- `blog.njk`: The layout for blog posts.

## Customizing Layouts

You can override any built-in layout by creating a file with the same name in your project's `layouts/` directory.

### Example: Custom Footer

To add a custom footer, you might modify `base.njk` or a partial that it includes.
