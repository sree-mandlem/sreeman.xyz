---
title: "Exploring Astro for My Portfolio on Cloudflare"
description: "Trying out Astro to understand if it fits a content-first portfolio setup"
date: 2026-03-21
---

## The question

I needed a framework for a personal site that does three things well: publish content easily, stay out of my way, and deploy fast. I've spent my career in Java backends and distributed systems — I didn't want to learn React just to write a blog post.

The requirements were simple:

- Markdown-first content authoring
- Minimal JavaScript in the browser
- Clean separation between content and presentation
- Deploy to Cloudflare (I already had the domain there)

## Why Astro stood out

Cloudflare's Worker template gallery suggested Astro, and the pitch was compelling: **zero JavaScript by default**. Every page compiles to static HTML unless you explicitly add interactivity. Coming from a backend mindset, this felt right — ship only what's needed.

What I didn't expect was how much Astro borrows from backend patterns:

- **Content collections** work like database tables — you define a schema (using Zod), put Markdown files in a folder, and query them with `getCollection('blog')`
- **Schema validation** catches broken frontmatter at build time, not at runtime. Missing a required `date` field? The build fails with a clear error
- **File-based routing** means `src/pages/blog/index.astro` becomes `/blog` and `src/pages/blog/[...slug].astro` generates a page per blog entry — no route configuration needed

This is how I'd design a content API, just without the API.

## What worked immediately

### Content collections

I set up three collections — `blog`, `projects`, `experiments` — each with its own Zod schema:

```typescript
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
  }),
});
```

Dropping a new `.md` file into `src/content/blog/` with valid frontmatter automatically creates a new page. No config changes, no database entries, no rebuild of unrelated pages. This is what "content-first" should feel like.

### The component model

Astro components (`.astro` files) use a clean split: JavaScript at the top (fenced by `---`), HTML template below. No virtual DOM, no state management, no hooks. It feels closer to server-side templates (Thymeleaf, Jinja) than to React.

Shared components like `Header.astro`, `Footer.astro`, and `BaseHead.astro` handle the page chrome. A single `BlogPost.astro` layout renders detail pages for all three collections. Change the layout once, every detail page updates.

### Scoped CSS

Each `.astro` component can include a `<style>` block that's automatically scoped to that component. No CSS modules, no styled-components, no naming conventions to follow. Global styles live in one `global.css` file imported by `BaseHead.astro`. The mental model is simple: if it's page-specific, scope it; if it's site-wide, put it in global.

## What tripped me up

### Cloudflare deployment

The Astro + Cloudflare integration is where things got confusing. Key things that weren't obvious:

1. **Workers vs Pages**: Cloudflare has two hosting products. This site uses Workers (with the `@astrojs/cloudflare` adapter), which compiles Astro into a Worker script rather than static files
2. **Wrangler is the CLI**: `npx wrangler deploy` pushes the built Worker to Cloudflare. But `npm run deploy` in the project only runs Wrangler — it doesn't rebuild. You need `npm run build && npm run deploy`
3. **The output isn't just HTML**: The build produces `dist/_worker.js/index.js` (the Worker entry point) plus static assets. Wrangler uploads both

Once I understood that the site is a _serverless function_, not a static file dump, the deployment model made sense. But the documentation could be clearer about this distinction.

### Template syntax quirks

Astro uses JSX-like syntax but it's not JSX. Some differences:

- `class` instead of `className`
- Expressions use `{variable}` but conditional rendering uses `{condition && <element />}` — no ternary required
- Props destructuring happens in the frontmatter fence, not in the template

These are small things, but coming from zero frontend experience, every unfamiliar pattern adds friction.

## The verdict

Astro is a strong fit for what I need. The content collection model is the right abstraction for a site that's primarily about publishing. The zero-JS default means I don't need to think about bundle sizes or hydration strategies. And the Cloudflare adapter, once understood, gives me edge deployment without infrastructure management.

The framework gets out of the way, which is the highest compliment I can give a tool. I'm not fighting it to publish — I'm just writing Markdown and pushing.

The site is live at [sreeman.xyz](https://sreeman.xyz), and the experiment proved the hypothesis: Astro is the right tool for this job.
