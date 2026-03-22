# Copilot instructions for `sreeman.xyz`

## Build, preview, and validation commands

- `npm run dev` starts the local Astro dev server on port 4321.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` runs `astro build && wrangler dev` to preview the Cloudflare Worker locally.
- `npm run check` is the closest thing to a full validation pass: `astro build && tsc && wrangler deploy --dry-run`.
- `npm run deploy` deploys the Worker via Wrangler. **Important:** this does NOT run `astro build` first — always run `npm run build` before `npm run deploy`, or use `npm run build && npm run deploy`.
- `npm test` or `npm run test:e2e` runs the Playwright e2e test suite (15 tests, Chromium only).
- `npm run test:ui` opens Playwright's visual test runner.

## Live site

- **Production URL:** https://sreeman.xyz
- **Custom domain:** Configured via Cloudflare Dashboard (not `wrangler.json` routes). Both `sreeman.xyz` and `www.sreeman.xyz` are custom domains on the Worker. The `www` variant redirects to the apex via a Cloudflare Redirect Rule.
- **workers.dev subdomain:** Disabled — all traffic goes through the custom domain only.
- **SSL:** Full (strict) mode, Always Use HTTPS enabled.

## High-level architecture

This is a content-first Astro site deployed as a Cloudflare Worker. Astro builds the site into `dist/`, and `wrangler.json` points the Worker entrypoint at `dist/_worker.js/index.js` while serving static assets from the same `dist/` directory.

Content lives in Astro content collections defined in `src/content.config.ts`. There are three collections:
- `blog` from `src/content/blog` — posts with title, date, description, subtitle, tags
- `projects` from `src/content/projects` — entries with title, description, tech array, github/demo links, date
- `experiments` from `src/content/experiments` — entries with title, description, date

All three collections have:
- **Index pages** (`src/pages/{collection}/index.astro`) — styled card listings with sorting by date descending
- **Detail pages** (`src/pages/{collection}/[...slug].astro`) — rendered markdown content using the `BlogPost.astro` layout

The index pages are fully styled with scoped CSS using the site's design tokens. Blog index has a two-column layout with a sidebar placeholder for future search/archive functionality.

## Page structure

| Route | Source | Description |
|-------|--------|-------------|
| `/` | `src/pages/index.astro` | Landing page — hero + section cards |
| `/blog` | `src/pages/blog/index.astro` | Blog listing — post cards with tags, date, read time |
| `/blog/[slug]` | `src/pages/blog/[...slug].astro` | Blog detail — rendered markdown |
| `/projects` | `src/pages/projects/index.astro` | Project listing — cards with tech pills, GitHub/demo links |
| `/projects/[slug]` | `src/pages/projects/[...slug].astro` | Project detail — rendered markdown |
| `/experiments` | `src/pages/experiments/index.astro` | Experiment listing — lab-notebook style cards |
| `/experiments/[slug]` | `src/pages/experiments/[...slug].astro` | Experiment detail — rendered markdown |
| `/about` | `src/pages/about.astro` | About page — bio, current focus, contact |
| `/rss.xml` | `src/pages/rss.xml.js` | RSS feed |

## Shared components

- `BaseHead.astro` — SEO meta tags, OG tags, font preloads. Imports `global.css`.
- `Header.astro` — Site title + nav links (Home, Blog, Experiments, Projects, About). No social links (removed).
- `HeaderLink.astro` — Nav link with automatic active state detection based on URL.
- `Footer.astro` — Copyright with dynamic year and `SITE_AUTHOR`. Social links are commented out (not yet configured with personal URLs).
- `FormattedDate.astro` — Renders `<time>` elements. Handles missing dates gracefully.
- `BlogPost.astro` — Layout for all detail pages (blog, projects, experiments). Accepts `title`, `description`, `date`, `subtitle?`, `readTime?`.

## Utilities

- `src/utils/readTime.ts` — Calculates estimated read time from markdown body content (200 WPM, minimum 1 minute). Used in blog index and blog detail pages.

## Design system

Defined in `src/styles/global.css`:
- **Font:** Atkinson (custom @font-face, WOFF, 400/700 weights)
- **Colors:** CSS variables using RGB tuples — `--accent: #2337ff`, `--accent-dark: #000d8a`, `--black`, `--gray`, `--gray-light`, `--gray-dark`, `--gray-gradient`
- **Container:** 720px max-width, `calc(100% - 2em)` responsive
- **Typography:** Modular heading scale (h1: 3.052em → h5: 1.25em), base 20px desktop / 18px mobile
- **Breakpoint:** 720px for responsive layout shifts
- **Classes:** `.prose` for reading content, `.sr-only` for accessibility

## Testing

Playwright is installed with Chromium only. Config at `playwright.config.ts`:
- Test directory: `tests/`
- Base URL: `http://localhost:4321`
- Web server: starts `npm run dev` automatically
- 15 e2e tests across 6 files covering all routes, navigation, responsive, and blog read time

Test files: `tests/smoke.spec.ts`, `tests/home.spec.ts`, `tests/blog.spec.ts`, `tests/projects.spec.ts`, `tests/experiments.spec.ts`, `tests/navigation.spec.ts`

**`test-results/` is gitignored** — Playwright generates this directory on each run.

## Key conventions

- Keep new long-form content in the content collections, not as ad hoc Astro pages. Use Markdown/MDX frontmatter that matches the Zod schemas in `src/content.config.ts`.
- All collection URLs are derived from the content entry `id` (`/{collection}/${entry.id}`), so file names inside `src/content/{collection}` become part of the route shape.
- Reuse shared layout/components for site-wide changes. All three collection detail pages use `BlogPost.astro` as their layout.
- If you add a new content collection, create both an `index.astro` and a `[...slug].astro` in `src/pages/{collection}/`.
- Global styling is centralized through `src/styles/global.css` imported by `BaseHead.astro`. Index pages use scoped `<style>` blocks that reference the global CSS variables.
- Cloudflare deployment behavior is part of normal development. Always run `npm run build` before `npm run deploy` (deploy alone does NOT rebuild).
- Run `npx playwright test` after changes to verify nothing is broken.
- Commit messages: use `deploy:` prefix for meaningful site changes, `fix:` for bug fixes.
- Commit trailer: use `Co-authored-by: Copilot` (no email address).

## Git setup

- **Remote:** SSH via host alias `github-personal` (configured in `~/.ssh/config`)
- **Personal account:** `sree-mandlem` on GitHub
- **Local identity:** `user.name = Sreeman` (set per-repo in `.git/config`)
- **Push command:** `git push origin main`
- **Work account** (`sree-mandlem-kfzteile24-de`) has a separate SSH key (`github-k24`) and is the default for `github.com`. This repo uses the `github-personal` alias to route through the personal key.

## What's NOT done yet

- **Blog search & archive sidebar** — The right panel placeholder exists in `src/pages/blog/index.astro` (`<aside class="sidebar">`). Tagged for future implementation: tag cloud, year→month archive, client-side search.
- **Footer social links** — Commented out in `Footer.astro`. Need to be updated with Sreeman's personal social URLs (not the Astro starter template defaults).
- **About page heroImage** — The about page no longer uses `BlogPost.astro` as its layout (it's standalone now), so the old `heroImage` prop path is gone.
- **RSS feed** — `src/pages/rss.xml.js` exists but hasn't been verified/updated since the site URL changed to `sreeman.xyz`.

## Model selection

When choosing a model for a task, refer to `.github/model-guide.md`. Key defaults:
- **Coding / refactoring / debugging** → GPT Codex family (standard)
- **Reasoning / research / analysis / synthesis** → Claude Sonnet 4.6 (standard)
- **Quick tasks** (triage, scanning, drafting, reviewing) → fast/cheap tier
- **High-stakes design / strategy** → Claude Opus 4.6 (premium)
- Within the same model family and cost tier, always prefer the higher version number.
- Use `/model` in the CLI to switch mid-session.

## Model switching protocol

Before switching models mid-session, the current model should produce a handoff summary:
1. What we were looking at — specific files, functions, or areas
2. What we found — exact issues, root causes, or decisions
3. What still needs to change — numbered list of specific edits
4. What to leave alone — anything explicitly decided not to touch
5. Open questions — anything unresolved

Use `/compact` when switching from a larger model to a smaller one.

## Relevant MCP server

Playwright MCP is a good fit for this repo. Use it to verify rendered pages, navigation, and content behavior against a running local site after `npm run dev` or `npm run preview`.

When using Playwright here:
- Prefer checking the core routes (`/`, `/blog`, `/projects`, `/experiments`, `/about`) after content or layout edits.
- Use it to confirm shared components like the header, footer, and active navigation state, since those affect multiple pages.
- For blog changes, validate both the blog index and at least one generated `/blog/<slug>` page because routing depends on content entry IDs and collection rendering.
- For projects/experiments changes, verify both index and detail pages similarly.
