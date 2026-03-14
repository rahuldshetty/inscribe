---
title: Themes & Customization
weight: 4
author: Inscribe Team
date: 2026-03-14
slug: themes-customization
---

# Themes & Customization

Inscribe comes with several beautiful built-in themes and makes it easy to create your own using standard CSS variables.

## Built-in Themes

You can switch between these themes by updating the `theme` key in your `inscribe.yaml`.

| Theme     | Description                                                                            |
| :-------- | :------------------------------------------------------------------------------------- |
| `default` | A modern, clean look with Slate blues and high readability.                            |
| `medium`  | Inspired by Medium.com, featuring elegant serifs and minimal borders.                  |
| `nord`    | A frosty, developer-focused palette with muted grays and arctic blues.                 |
| `sepia`   | A warm, low-contrast theme designed to reduce eye strain during long reading sessions. |

## Applying a Theme

To change your site's theme, edit your `inscribe.yaml`:

```yaml
theme: 'nord'
```

## Custom Themes

Creating a custom theme is as simple as creating a new CSS file.

### 1. Create a Theme File

Create a new file in your project's `themes/` directory (e.g., `themes/my-awesome-theme.css`).

### 2. Define CSS Variables

Inscribe uses a set of CSS variables to control the look and feel. We recommend using the `light-dark()` function for automatic light/dark mode support.

```css
:root {
  color-scheme: light dark;

  /* Backgrounds */
  --color-bg:       light-dark(#ffffff, #121212);
  --color-text:     light-dark(#1a1a1a, #eeeeee);
  --color-accent:   light-dark(#3b82f6, #60a5fa);

  /* Borders & Tags */
  --color-border:   light-dark(#e5e7eb, #262626);
  --color-tag-bg:   light-dark(#f3f4f6, #262626);
  --color-tag-text: light-dark(#4b5563, #d1d5db);

  /* Code */
  --color-code-bg:  light-dark(#f3f4f6, #262626);
  --color-pre-bg:   light-dark(#1f2937, #000000);
  --color-pre-text: #ffffff;

  /* Fonts */
  --font-sans:      'Inter', sans-serif;
  --font-serif:     'Merriweather', serif;
}
```

### 3. Use Your Theme

Update your `inscribe.yaml` to match your filename (without the `.css` extension):

```yaml
theme: 'my-awesome-theme'
```

## CSS Variable Reference

| Variable           | Description                                           |
| :----------------- | :---------------------------------------------------- |
| `--color-bg`       | The primary background color of the page.             |
| `--color-text`     | The primary text color.                               |
| `--color-muted`    | Used for subheaders, dates, and less important text.  |
| `--color-accent`   | The color for links and primary interactive elements. |
| `--color-border`   | The color for dividers and section borders.           |
| `--color-tag-bg`   | The background of tag/category pills.                 |
| `--color-tag-text` | The text color inside tag pills.                      |
| `--color-code-bg`  | Background for inline code snippets.                  |
| `--color-pre-bg`   | Background for large code blocks.                     |
| `--font-sans`      | The font family for headings and UI elements.         |
| `--font-serif`     | The font family used for the main article/body text.  |
