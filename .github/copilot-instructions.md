# Copilot instructions for `sreeman.xyz`

## Build, preview, and validation commands

- `npm run dev` starts the local Astro dev server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` runs `astro build && wrangler dev` to preview the Cloudflare Worker locally.
- `npm run check` is the closest thing to a full validation pass: `astro build && tsc && wrangler deploy --dry-run`.
- `npm run deploy` deploys the Worker via Wrangler.
- There is no dedicated lint script and no automated test runner configured in `package.json`.
- There is no single-test command because no test framework is set up in this repo.

## High-level architecture

This is a content-first Astro site deployed with the Cloudflare adapter. Astro builds the site into `dist/`, and `wrangler.json` points the Worker entrypoint at `dist/_worker.js/index.js` while serving static assets from the same `dist/` directory.

Content lives in Astro content collections defined in `src/content.config.ts`. There are three collections:
- `blog` from `src/content/blog`
- `projects` from `src/content/projects`
- `experiments` from `src/content/experiments`

Those collections drive the site structure. The section index pages in `src/pages/blog/index.astro`, `src/pages/projects/index.astro`, and `src/pages/experiments/index.astro` call `getCollection(...)` directly and render simple lists from frontmatter.

Blog detail pages are generated from content entries, not hand-authored routes. `src/pages/blog/[...slug].astro` uses `getStaticPaths()` over the `blog` collection and passes each entry into `render(post)`, then wraps the result in `src/layouts/BlogPost.astro`.

Shared page chrome is split between `src/components/BaseHead.astro`, `Header.astro`, and `Footer.astro`. `BaseHead.astro` is also where `src/styles/global.css` is pulled in, so global styling and metadata changes usually start there rather than in individual pages.

Site-wide metadata currently comes from `src/consts.ts`, and the RSS feed in `src/pages/rss.xml.js` reuses those constants plus blog collection data. If you change site title/description or blog URL structure, update both the shared constants and the RSS/page consumers together.

README.md and SYSTEM.md treat meaningful changes as deployments. The repo workflow is oriented around small, focused site updates that are validated locally, then pushed through Wrangler/Cloudflare.

## Key conventions

- Keep new long-form content in the content collections, not as ad hoc Astro pages. Use Markdown/MDX frontmatter that matches the Zod schemas in `src/content.config.ts`.
- Blog URLs are derived from the content entry `id` (`/blog/${post.id}`), so file names and folder structure inside `src/content/blog` become part of the route shape.
- Reuse shared layout/components for site-wide changes. Navigation lives in `src/components/Header.astro` and active-link logic lives in `src/components/HeaderLink.astro`.
- `BlogPost.astro` expects blog-entry data shaped like `CollectionEntry<'blog'>['data']`. If you change blog frontmatter fields, update the collection schema and any layout/component consumers together.
- Global styling is centralized through `src/styles/global.css` imported by `BaseHead.astro`; prefer that path for broad visual changes instead of duplicating styles across pages.
- Cloudflare deployment behavior is part of normal development here. For changes that affect runtime/build output, prefer `npm run check` before `npm run deploy`.
- The repo still contains Astro starter-template remnants in places like `src/pages/index.astro`, `src/pages/about.astro`, `src/components/Header.astro`, and `src/components/Footer.astro`. When making branding/content updates, check those files together so starter copy and social links do not drift from the rest of the site.
- Existing docs use deployment-oriented language and `deploy:` commit messages for meaningful site changes; follow that wording when updating workflow docs or preparing commits.

## Model selection

When choosing a model for a task, refer to `.github/model-guide.md`. Key defaults:
- **Coding / refactoring / debugging** → GPT Codex family (standard)
- **Reasoning / research / analysis / synthesis** → Claude Sonnet 4.6 (standard)
- **Quick tasks** (triage, scanning, drafting, reviewing) → fast/cheap tier
- **High-stakes design / strategy** → Claude Opus 4.6 (premium)
- Within the same model family and cost tier, always prefer the higher version number.
- Use `/model` in the CLI to switch mid-session.

## Relevant MCP server

Playwright MCP is a good fit for this repo. Use it to verify rendered pages, navigation, and content behavior against a running local site after `npm run dev` or `npm run preview`.

When using Playwright here:
- Prefer checking the core routes (`/`, `/blog`, `/projects`, `/experiments`, `/about`) after content or layout edits.
- Use it to confirm shared components like the header, footer, and active navigation state, since those affect multiple pages.
- For blog changes, validate both the blog index and at least one generated `/blog/<slug>` page because routing depends on content entry IDs and collection rendering.

