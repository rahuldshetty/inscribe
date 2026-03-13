---
title: Theme
weight: 4
author: Inscribe Team
date: 2026-03-13
slug: advanced-theme
---

# Themes

Inscribe uses a powerful CSS variable-based theming system.

## default.css

The default theme is defined in `themes/default.css`. It supports both light and dark modes out of the box.

## Custom Themes

You can create your own theme by adding a new CSS file to the `themes/` directory and referencing it in `inscribe.yaml`:

```yaml
theme: my-cool-theme
```

## CSS Variables

Inscribe uses variables like:
- `--color-bg`: Background color
- `--color-text`: Primary text color
- `--color-muted`: Muted text color
- `--color-border`: Border color
