<div align="center">
  <img src="docs/inscribe.png" alt="Inscribe Logo" width="240" />
  <!-- <h1>Inscribe</h1> -->
  <p><strong>A minimalist, high-performance Static Site Generator (SSG)</strong></p>
  <p>
    <img src="https://img.shields.io/badge/status-under%20development-orange" alt="Project Status" />
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
    <img src="https://img.shields.io/badge/built%20with-Bun-black" alt="Built with Bun" />
  </p>
</div>

---

Inscribe is a modern static site generator built with **Bun**, **MDX**, and **Preact**. It's designed to be fast, simple, and developer-friendly, making it perfect for blogs, documentation, and personal portfolios.

> [!IMPORTANT]
> This project is currently **under active development**. Features and APIs are subject to change.

## ✨ Features

- [x] **CLI** – Simple commands to scaffold, develop, and build your site.
- [x] **Dev Server** – Local development server with instant live reload.
- [x] **MDX & Markdown** – Write content using powerful MDX and standard Markdown.
- [x] **Themes** – Customizable and extensible theme system.
- [ ] **Search** – Integrated full-text search.
- [ ] **Plugins** – Flexible plugin architecture for extending functionality.

## 🚀 Quick Start

### Installation

```bash
# Using Bun (Recommended)
bun install -g @rahuldshetty/inscribe

# Using npm
npm install -g @rahuldshetty/inscribe
```

### Usage

Scaffold a new project, start the development server, or build for production.

```bash
# Initialize a new project in the current directory
inscribe init

# Run the development server with live reload
inscribe dev

# Build the static site for production
inscribe build
```

## 🛠️ Commands

| Command        | Description                                                     |
| :------------- | :-------------------------------------------------------------- |
| `init`         | Create a new scaffold for your blog or portfolio.               |
| `dev [path]`   | Start the local development server (default: `.` port `3000`).  |
| `build [path]` | Generate a production-ready static website (default: `./dist`). |

---

<p align="center">Made with ❤️ by <a href="https://github.com/rahuldshetty">rahuldshetty</a></p>
