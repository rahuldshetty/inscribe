---
title: Doc Page
weight: 3
author: Inscribe Team
date: 2026-03-13
slug: advanced-doc-page
---

# Documentation Pages

Documentation pages are organized hierarchically based on your folder structure in the `docs/` directory.

## Doc Metadata

Documentation pages share the same metadata schema as blog pages. These fields allow you to control the page title, its position in the sidebar, and its appearance.

| Field         | Type         | Description                                                                          |
| :------------ | :----------- | :----------------------------------------------------------------------------------- |
| `title`       | **Required** | The title shown in the sidebar and at the top of the page.                           |
| `weight`      | Optional     | **Critical for Docs**: Controls the order in the sidebar. Lower values appear first. |
| `slug`        | **Required** | The URL-friendly identifier for the page.                                            |
| `author`      | Optional     | The author of the document.                                                          |
| `date`        | Optional     | Publication or last updated date.                                                    |
| `description` | Optional     | Brief summary of the document.                                                       |
| `cover`       | Optional     | Image URL shown as a hero section (same as blogs).                                   |
| `showToc`     | Optional     | Boolean to show a Table of Contents.                                                 |
| `draft`       | Optional     | Boolean to hide the page in production.                                              |

### Premium Example

Here is an example of a well-organized documentation page:

```yaml
---
title: 'Advanced Configuration'
weight: 10
author: 'Inscribe Team'
date: 2026-03-14
slug: advanced-config
description: 'Master the advanced settings of the Inscribe framework.'
cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa'
showToc: true
---
```

## Organizing Your Docs

The Inscribe framework uses your folder structure and the `weight` field to build the navigation sidebar.

### Sidebar Ordering

Posts are first sorted by their `weight` (ascending) and then alphabetically by their `title`. To ensure a specific order, assign sequential weights (e.g., `10`, `20`, `30`) to your files.

### Customizing Folders (`index.md`)

You can customize the appearance of folders in the sidebar by placing an `index.md` file inside the folder. The `index.md` file can specify its own `title` and `weight`:

```yaml
---
title: 'Deployment Guides'
weight: 50
---
```

This will rename the folder in the sidebar to "Deployment Guides" and move it according to the specified weight.

## Hierarchy

The directory structure in `docs/` is reflected in the sidebar. You can use subdirectories to group related pages indefinitely.
