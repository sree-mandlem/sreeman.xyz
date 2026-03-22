---
title: "Personal AI Portfolio and Learning Lab"
description: "Personal portfolio and learning lab documenting my journey in AI, software development, and experiments."
tech: ["astro", "typescript", "cloudflare-workers", "playwright"]
github: "https://github.com/sree-mandlem/sreeman.xyz"
demo: "https://sreeman.xyz"
date: 2026-03-21
---

## What this is

This is the site you're reading right now — [sreeman.xyz](https://sreeman.xyz). A personal portfolio and learning lab built from scratch, designed to be a space where I document what I learn, ship what I build, and experiment with ideas in public.

As a senior backend engineer who has spent years deep in Java, AWS, and distributed systems, I wanted a space that was _mine_ — not a Medium blog, not a LinkedIn post, but something I fully own and control.

## Why I built it

I've worked across e-commerce, automotive, payments, and food delivery. In every domain, I noticed the same pattern: the engineers who grew fastest were the ones who wrote things down and shared what they learned. I wanted to build that habit for myself, and I wanted the act of publishing to be as frictionless as pushing code.

The goal was simple: **treat content like code**. Write it, validate it, deploy it.

## How it's built

The site runs on **Astro** — a content-first framework that compiles to static HTML with zero JavaScript by default. Content lives in Markdown files organized into three collections (blog, projects, experiments), each validated against Zod schemas at build time.

The architecture follows a clear separation:

- **Content collections** in `src/content/` hold all the writing as Markdown
- **Zod schemas** in `src/content.config.ts` enforce frontmatter structure
- **Dynamic routes** (`[...slug].astro`) generate pages from collection entries
- **Shared layout** (`BlogPost.astro`) renders all detail pages consistently

Everything deploys as a **Cloudflare Worker** — not a traditional static host, but a serverless function running at the edge. The Astro Cloudflare adapter compiles the site into a Worker script (`dist/_worker.js/index.js`) that Wrangler deploys globally.

## What I learned building it

### Content collections are powerful

Astro's content collections with Zod validation caught several frontmatter mistakes during builds — missing dates, wrong types, fields I forgot to add. This is something I would have expected from a backend API schema, not a blog framework. It made the system feel robust.

### Cloudflare's ecosystem has a learning curve

Coming in fresh, the relationship between Workers, Pages, Wrangler, and the dashboard wasn't obvious. Key things I had to learn:

- `npm run deploy` only runs `wrangler deploy` — it does NOT rebuild the site first
- Custom domains are configured through the dashboard, not in `wrangler.json`
- SSL Full (strict) mode and Always Use HTTPS are separate settings
- The `www` → apex redirect requires a Cloudflare Redirect Rule, not a DNS record

I wrote a [full blog post](/blog/astro-cloudflare-custom-domain) documenting the entire custom domain setup process.

### AI-assisted development works, with guardrails

This entire site was built in a single session using AI pair programming (GitHub Copilot CLI). Different models handled different tasks: coding agents wrote the implementation, review agents checked the output, and exploration agents navigated the codebase. The key insight: AI is most effective when you give it clear, scoped tasks and verify the output. It's a collaborator, not a replacement.

### Testing a content site is worth it

I added 15 Playwright end-to-end tests covering every route, navigation flow, and responsive layout. They've already caught regressions during refactoring — especially when restructuring the home page and moving content between pages. For a "simple" content site, tests provide surprising value.

## Features

- **Content collections** with Zod schema validation for blog, projects, and experiments
- **Read time estimates** calculated from markdown word count (200 WPM)
- **Responsive design** with a 720px breakpoint and mobile-first approach
- **Custom domain** with SSL, www→apex redirect, and canonical URLs
- **E2E testing** with Playwright (15 tests, Chromium)
- **Edge deployment** on Cloudflare Workers for global low-latency serving

## What's next

- Search and tag filtering for the blog sidebar
- RSS feed verification and improvement
- More content — the site is only as useful as what's published on it