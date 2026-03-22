---
title: "Exploring Astro for My Portfolio on Cloudflare"
description: "Trying out Astro to understand if it fits a content-first portfolio setup"
date: 2026-03-21
---

I started looking into Astro as a potential candidate for my portfolio/blog site.

My requirements were simple: I want something that makes it easy to publish content (notes, experiments, projects) without turning the whole thing into a heavy frontend app, but also a bit of kick.

First impression — Astro was suggested by cloudflare and seemed like a good fit.

Upon further exploration, it seems it offers a separation between content and pages, which is neat. Markdown works out of the box, and works with what ever typescript I know. Using React-first setup seemed to be a overkill.

The project structure is also straightforward and easily inferred. This is a good sign as I need less learning curve, atleast for starting with it. One does not need to spend time fighting the framework just to publish a page.

At the same time, there were things got slightly confusing: deployment.

As mentioned earlier, I choose Cloudflare for my portfolio. It’s ecosystem (Pages vs Workers, Wrangler, templates) is not immediately obvious when you come in fresh. It took a bit of trial and error to understand what actually triggers a deployment and how the repo is supposed to be structured. The onboarding is not obvious, but...

Once that clicks, the flow starts to make sense:
push → build → deploy → live

Right now, the focus is not on polishing the UI but on setting up a system that makes publishing frictionless.

Next step is to structure the site properly:
- blog → learnings
- projects → things I build
- experiments → quick explorations like this one

If that structure holds, Astro should be a solid long-term fit.