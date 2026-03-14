---
title: Static Files
weight: 1
author: Inscribe Team
date: 2026-03-14
slug: static-files
---

# Static Files

Inscribe provides a simple way to manage static assets like images, PDFs, and custom scripts.

## The `static/` Directory

By default, Inscribe looks for a directory named `static/` in your project root. Any files and folders placed inside this directory are copied exactly as they are to the output directory during the build process.

For example, if your project structure looks like this:

```text
my-inscribe-site/
├── static/
│   ├── images/
│   │   └── logo.png
│   └── custom.js
├── docs/
└── inscribe.yaml
```

After building, your output will contain:

```text
dist/
├── static/
│   ├── images/
│   │   └── logo.png
│   └── custom.js
├── index.html
└── ...
```

## Referencing Static Assets

When referencing assets in your Markdown files or custom layouts, you should use paths relative to the root, starting with `/static/`.

### In Layouts (Nunjucks)

If you are creating custom themes or layouts, it is best practice to use the `url` filter to ensure paths are correctly resolved, especially when using a `base_url`.

```html
<img src="{{ '/static/images/logo.png' | url }}" alt="Logo">
<script src="{{ '/static/custom.js' | url }}"></script>
```
