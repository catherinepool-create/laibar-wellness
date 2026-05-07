#!/usr/bin/env python3
"""Convert markdown posts in posts/ to HTML and update blog.html + sitemap.xml."""

import re
import sys
from datetime import date, datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML not found — install with: pip install PyYAML")
    sys.exit(1)

try:
    import markdown as md_lib
except ImportError:
    print("markdown not found — install with: pip install markdown")
    sys.exit(1)

SITE_ROOT = Path(__file__).parent.parent
POSTS_DIR = SITE_ROOT / "posts"
BLOG_DIR  = SITE_ROOT / "blog"
BLOG_HTML = SITE_ROOT / "blog.html"
SITEMAP   = SITE_ROOT / "sitemap.xml"
BASE_URL  = "https://laibarwellness.com/blog/"


def parse_frontmatter(text):
    """Return (meta_dict, body_text). Supports --- YAML --- blocks."""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                meta = {}
            return meta, parts[2].strip()
    return {}, text.strip()


def to_html(md_text):
    """Convert markdown body to HTML."""
    converter = md_lib.Markdown(extensions=["extra", "nl2br"])
    return converter.convert(md_text)


def format_date(raw):
    """Return (iso_str, display_str) from a date value."""
    try:
        dt = datetime.strptime(str(raw), "%Y-%m-%d")
        return dt.strftime("%Y-%m-%d"), dt.strftime("%B %-d, %Y")
    except Exception:
        today = date.today()
        return today.strftime("%Y-%m-%d"), today.strftime("%B %-d, %Y")


def read_time(html):
    words = len(re.sub(r"<[^>]+>", " ", html).split())
    return f"{max(1, round(words / 200))} min read"


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def build_post_html(meta, body_html):
    title       = meta.get("title", "Untitled")
    description = meta.get("description", "")
    category    = meta.get("category", "Wellness")
    slug        = meta["slug"]
    iso, display = format_date(meta.get("date", date.today()))
    rt          = read_time(body_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="google-site-verification" content="JR44j6ZvrAkLtfflr0MTnopqiwuTOiR0b3vTKBrv3Pc">
  <title>{title} | Laibar Wellness</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="{BASE_URL}{slug}.html">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="https://laibarwellness.com/images/bottle-front.png">
  <meta property="og:url" content="{BASE_URL}{slug}.html">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{title}",
    "description": "{description}",
    "datePublished": "{iso}",
    "author": {{"@type": "Organization", "name": "Laibar Wellness"}},
    "publisher": {{"@type": "Organization", "name": "Laibar Wellness", "url": "https://laibarwellness.com"}},
    "url": "{BASE_URL}{slug}.html"
  }}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <style>
    .article-hero {{ background: linear-gradient(rgba(10,10,10,0.7), rgba(10,10,10,0.8)), linear-gradient(135deg, #1a2520 0%, #2a3020 100%); padding: 80px 0 60px; text-align: center; }}
    .article-hero h1 {{ font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 4vw, 2.8rem); color: #f0ece4; max-width: 720px; margin: 0 auto 1rem; }}
    .article-meta {{ color: #6b6760; font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; }}
    .article-body {{ max-width: 720px; margin: 0 auto; padding: 60px 1.5rem; }}
    .article-body h2 {{ font-family: 'Playfair Display', serif; color: #f0ece4; margin: 2.5rem 0 1rem; font-size: 1.5rem; }}
    .article-body h3 {{ color: #c8a55a; font-size: 1.1rem; margin: 1.75rem 0 0.5rem; }}
    .article-body p {{ color: #a8a49c; line-height: 1.8; margin-bottom: 1.25rem; }}
    .article-body ul, .article-body ol {{ color: #a8a49c; line-height: 1.8; padding-left: 1.5rem; margin-bottom: 1.25rem; }}
    .article-body li {{ margin-bottom: 0.75rem; }}
    .article-body strong {{ color: #c8a55a; }}
    .article-body em {{ color: #c9d1c0; }}
    .article-body blockquote {{ background: rgba(200,165,90,0.06); border-left: 3px solid #c8a55a; padding: 1.25rem 1.5rem; margin: 1.75rem 0; border-radius: 0 8px 8px 0; color: #f0ece4; }}
    .article-cta {{ background: rgba(200,165,90,0.08); border: 1px solid rgba(200,165,90,0.2); border-radius: 12px; padding: 2rem; text-align: center; margin: 3rem 0; }}
    .article-cta h3 {{ font-family: 'Playfair Display', serif; color: #f0ece4; margin-bottom: 0.75rem; }}
    .article-cta p {{ color: #a8a49c; margin-bottom: 1.5rem; }}
    .back-link {{ display: inline-flex; align-items: center; gap: 0.4rem; color: #c8a55a; text-decoration: none; font-size: 0.9rem; margin-bottom: 2rem; }}
    .back-link:hover {{ color: #f0ece4; }}
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="container nav-container">
      <a class="nav-logo" href="../index.html">LAIBAR<span>Wellness</span></a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      <ul class="nav-links">
        <li><a href="../index.html">Home</a></li>
        <li><a href="../product-detail.html?id=1">The Formula</a></li>
        <li><a href="../about.html">Our Science</a></li>
        <li><a href="../blog.html" class="active">Blog</a></li>
        <li><a href="../contact.html">Contact</a></li>
      </ul>
      <a class="nav-cart" href="../cart.html" aria-label="Shopping cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="cart-badge">0</span>
      </a>
    </div>
  </nav>

  <section class="article-hero">
    <div class="container">
      <span class="blog-category" style="display:inline-block;margin-bottom:1rem">{category}</span>
      <h1>{title}</h1>
      <p class="article-meta">{display} &nbsp;&bull;&nbsp; {rt}</p>
    </div>
  </section>

  <div class="article-body">
    <a href="../blog.html" class="back-link">← Back to The Journal</a>

    {body_html}

    <div class="article-cta">
      <h3>Ready to support your joints?</h3>
      <p>12 active ingredients. Full therapeutic doses. Move without limits.</p>
      <a href="../product-detail.html?id=1" class="btn btn-primary">Shop Laibar — $64.99</a>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="nav-logo" href="../index.html">LAIBAR<span>Wellness</span></a>
          <p>Premium joint support designed for active adults.</p>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <a href="../product-detail.html?id=1">Joint Support Formula</a>
          <a href="../cart.html">Your Cart</a>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <a href="../about.html">Our Science</a>
          <a href="../blog.html">Blog</a>
          <a href="../contact.html">Contact</a>
        </div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 Laibar Wellness. All rights reserved.</p></div>
    </div>
  </footer>
  <script src="../js/main.js"></script>
</body>
</html>"""


def build_blog_card(meta):
    title       = meta.get("title", "Untitled")
    description = meta.get("description", "")
    category    = meta.get("category", "Wellness")
    slug        = meta["slug"]
    _, display  = format_date(meta.get("date", date.today()))

    return (
        f'\n        <article class="blog-card">\n'
        f'          <div class="blog-card-image" style="background: linear-gradient(135deg, #1a2520 0%, #2a3520 50%, #1a2a20 100%);"></div>\n'
        f'          <div class="blog-card-body">\n'
        f'            <span class="blog-category">{category}</span>\n'
        f'            <h2><a href="blog/{slug}.html">{title}</a></h2>\n'
        f'            <p>{description}</p>\n'
        f'            <div class="blog-meta">\n'
        f'              <span>{display}</span>\n'
        f'              <span>&bull;</span>\n'
        f'              <span>5 min read</span>\n'
        f'            </div>\n'
        f'          </div>\n'
        f'        </article>\n'
    )


def update_blog_html(card_html):
    content = BLOG_HTML.read_text(encoding="utf-8")
    marker = '<div class="blog-grid fade-in">'
    if marker not in content:
        print("Warning: blog grid marker not found in blog.html — card not added")
        return
    BLOG_HTML.write_text(
        content.replace(marker, marker + card_html, 1),
        encoding="utf-8"
    )


def update_sitemap(slug, iso_date):
    content = SITEMAP.read_text(encoding="utf-8")
    entry = (
        f"  <url>\n"
        f"    <loc>{BASE_URL}{slug}.html</loc>\n"
        f"    <lastmod>{iso_date}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.7</priority>\n"
        f"  </url>\n"
    )
    SITEMAP.write_text(
        content.replace("</urlset>", entry + "</urlset>"),
        encoding="utf-8"
    )


def main():
    md_files = sorted(POSTS_DIR.glob("*.md"))
    if not md_files:
        print("No .md files found in posts/ — nothing to do.")
        return

    published = 0
    for path in md_files:
        text = path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(text)

        # Derive slug
        if not meta.get("slug"):
            meta["slug"] = slugify(meta.get("title", path.stem))

        slug = meta["slug"]
        out  = BLOG_DIR / f"{slug}.html"

        if out.exists():
            print(f"Skip (already published): {slug}")
            continue

        print(f"Publishing: {slug}")
        body_html = to_html(body)
        out.write_text(build_post_html(meta, body_html), encoding="utf-8")

        update_blog_html(build_blog_card(meta))
        iso, _ = format_date(meta.get("date", date.today()))
        update_sitemap(slug, iso)

        published += 1
        print(f"  → blog/{slug}.html created")

    print(f"\nDone — {published} new post(s) published.")


if __name__ == "__main__":
    main()
