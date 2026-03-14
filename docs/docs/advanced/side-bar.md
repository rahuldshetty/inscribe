---
title: Side Bar
weight: 3
author: Inscribe Team
date: 2026-03-13
slug: advanced-sidebar
---

# Side Bar Navigation

The sidebar is automatically generated based on the folder structure and files within your `docs/` directory.

## Sorting Logic

Inscribe builds the sidebar hierarchy using a two-step sorting process:

1. **Weight**: Defined in the frontmatter (doc page). Lower numbers appear at the top.
2. **Title**: If weights are missing or equal, items are sorted alphabetically.

## Example Folder Structure

Here is how a typical documentation directory translates to the sidebar UI:

```text
docs/
├── getting-started.md   (weight: 10)
├── installation.md      (weight: 20)
├── advanced/
│   ├── index.md         (title: "Pro Features", weight: 30)
│   ├── side-bar.md      (weight: 10)
│   └── themes.md        (weight: 20)
└── api/
    └── reference.md     (weight: 40)
```

**Resulting Sidebar:**

- Getting Started
- Installation
- **Pro Features** (folder)
  - Side Bar
  - Themes
- API (folder - _automatically named_)
  - Reference

## Assigning Weights

Weights should be assigned in the YAML frontmatter of your `.md` files.

**Sample: First page**

```yaml
---
title: Introduction
weight: 10
---
```

**Sample: Middle page**

```yaml
---
title: Configuration
weight: 50
---
```

> [!TIP]
> Use increments of 10 (10, 20, 30) for your weights. This makes it easy to "insert" a new page between two existing ones later without renumbering everything.

## Customizing Folders (`index.md`)

By default, Inscribe uses the folder name as the title in the sidebar. To customize this, place an `index.md` file inside the folder.

```yaml
---
title: 'Advanced Customization'
weight: 100
---
```

The `index.md` file itself will not appear as a clickable link in the sidebar; instead, its metadata is applied to the folder container.
