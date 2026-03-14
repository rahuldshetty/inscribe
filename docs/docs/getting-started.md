---
title: Getting Started
weight: 1
author: Inscribe Team
date: 2026-03-13
slug: getting-started
---

# Getting Started with Inscribe

Inscribe is a modern Static Site Generator (SSG) designed for speed, simplicity, and beautiful documentation.

## Installation

Inscribe is distributed as a CLI tool. You can install it using your favorite package manager.

### Prerequisites

- [Bun](https://bun.sh) (Recommended) or Node.js
- Basic knowledge of Markdown

### Install via NPM

```bash
npm install -g @rahuldshetty/inscribe
```

### Install via Bun

```bash
bun add -g @rahuldshetty/inscribe
```

### Verify Installation

Check if inscribe is installed correctly by running:

```bash
inscribe --version
```

## Your First Project

To create a new Inscribe project, you can use the `init` command:

```bash
inscribe init my-docs
```

This will create a new directory `my-docs` with the following structure:

- `docs/`: Your documentation markdown files.
- `blogs/`: Your blog post markdown files.
- `inscribe.yaml`: Main configuration file.
- `layouts/`: Custom Nunjucks templates.
- `themes/`: Custom CSS themes.

## Development Mode

For a live-reloading development experience, use:

```bash
inscribe dev
```

## Building Your Site

To build your site, run the `build` command from your project root:

```bash
inscribe build
```

The generated static files will be located in the `dist` directory.
