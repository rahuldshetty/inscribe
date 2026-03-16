---
title: inscribe.yaml
weight: 0
author: Inscribe Team
date: 2026-03-14
slug: inscribe-yaml
---

# inscribe.yaml

The `inscribe.yaml` file located in your project root is the central hub for configuring your global site settings.

## Configuration Options

Below are all the available settings supported by the Inscribe framework:

| Option                | Type    | Default         | Description                                                  |
| :-------------------- | :------ | :-------------- | :----------------------------------------------------------- |
| `title`               | string  | `Inscribe`      | The main title of your website.                              |
| `tagline`             | string  | `Inscribe Blog` | A short description or subtitle for your site.               |
| `favicon`             | string  | `favicon.ico`   | Path to your site's favicon icon.                            |
| `theme`               | string  | `default`       | Name of the theme to use (look in your `themes/` folder).    |
| `show_home`           | boolean | `true`          | Whether to display the landing/home page.                    |
| `blog_path`           | string  | `blog`          | The directory where your blog posts are stored.              |
| `doc_path`            | string  | `docs`          | The directory where your documentation is stored.            |
| `show_doc_nav`        | boolean | `true`          | Whether to show the left navigation sidebar on doc pages.    |
| `base_url`            | string  | `/`             | The base URL path for the site (useful for subpath hosting). |
| `google_analytics_id` | string  | `""`            | Your Google Analytics Measurement ID (e.g., `G-XXXXXXXXXX`). |

## Sample Configuration

Here is a complete example of a customized `inscribe.yaml` file:

```yaml
title: 'Developer Portal'
tagline: 'Building the future, one commit at a time.'
theme: 'midnight-modern'
favicon: 'assets/logo.png'

# Section Configuration
blog_path: 'journal'
doc_path: 'guides'

# Visibility
show_home: true
show_doc_nav: true

# Advanced
base_url: '/my-project/'

# Analytics
google_analytics_id: 'G-XXXXXXXXXX'
```

## Advanced Settings

### Custom Paths

If you change `blog_path` or `doc_path`, ensure the folders exist in your project root. For example, if you set `blog_path: "articles"`, Inscribe will look for markdown files in your `articles/` directory.

### Disabling Sections

You can effectively "disable" the blog or documentation sections by setting their respective paths to an empty string (`""`) or a `null` value in the YAML.

### Sidebar Visibility

If you are building a small documentation site with only a few pages, you might want to set `show_doc_nav: false` to hide the left sidebar and give more focus to the content.

### Base URL and Subpath Hosting

The `base_url` setting is critical when your site is hosted on a subpath rather than the root of a domain. This is common for **GitHub Pages**, where sites are often hosted at `https://<username>.github.io/<repository-name>/`.

In such cases, you should set `base_url` to your repository name:

```yaml
base_url: '/inscribe/'
```

This ensures that all internal links, CSS, and asset paths are correctly prefixed, preventing "404 Not Found" errors on your deployed site.

### Google Analytics Integration

You can easily integrate Google Analytics (GA4) into your Inscribe site by providing your Measurement ID.

1.  Log in to your [Google Analytics](https://analytics.google.com/) account.
2.  Navigate to your Property settings and find your **Measurement ID** (it usually starts with `G-`).
3.  Add the ID to your `inscribe.yaml` file:

```yaml
google_analytics_id: 'G-374829KJ82'
```

When you build your site, Inscribe will automatically inject the necessary `gtag.js` scripts into every page. If the field is left empty or omitted, no analytics scripts will be included.
