# Blog Posts — OpenClaw Drop Zone

**Naming rule:** Files starting with `_` or `.` are ignored by the publish script.
This file is named `_README.md` for that reason — do NOT rename it to `README.md`.

Drop new `.md` files here. On push to `main`, GitHub Actions will automatically:
1. Convert them to HTML in `blog/`
2. Add a card to `blog.html`
3. Add an entry to `sitemap.xml`

## Required frontmatter

Every file must start with a YAML block exactly like this:

```
---
title: Your Post Title Here
description: One or two sentences for meta description and the blog card preview.
category: Joint Health
date: 2026-05-06
slug: your-post-slug-here
---

Article content starts here...
```

### Field reference

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Used in `<title>`, `<h1>`, and the blog card |
| `description` | yes | Keep under 160 characters for SEO |
| `category` | yes | Shown as the pill label — e.g. `Ingredients`, `Science`, `Lifestyle`, `Guide` |
| `date` | yes | Format: `YYYY-MM-DD` |
| `slug` | yes | URL-safe, hyphen-separated, no spaces — e.g. `boswellia-anti-inflammatory` |

## File naming

Name the file anything you like — the `slug` field controls the output URL, not the filename.

Example: `boswellia-post.md` with `slug: boswellia-anti-inflammatory` → `blog/boswellia-anti-inflammatory.html`

## Skipping already-published posts

If `blog/{slug}.html` already exists, the script skips that file. Safe to re-push without duplicating.

## Markdown support

Standard markdown plus:
- `**bold**` → gold highlighted text
- `*italic*`
- `## Heading` → Playfair Display section header
- `> blockquote` → gold left-border callout box
- Bullet and numbered lists
- Tables (via `markdown-extra`)
