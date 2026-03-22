---
title: "Taking an Astro Site Live on Cloudflare with a Custom Domain"
description: "A walkthrough of every Cloudflare setting I changed to go from a workers.dev URL to a real domain — and why each one matters. Covers Workers, DNS, SSL, redirects, and SEO basics from the ground up."
subtitle: "From workers.dev to your own corner of the web."
date: 2026-03-22
tags: ["cloudflare", "astro", "deployment", "dns", "ssl"]
---

I had my portfolio running on `sreemanxyz.sreeman.workers.dev` for about a day. It worked fine, but sharing that URL felt like handing someone a tracking number instead of an address. So I bought `sreeman.xyz` and spent an evening wiring it up.

Here's everything I changed in Cloudflare and why. I'm going to explain the concepts along the way, because when I was doing this, I wished someone had spelled it all out in one place instead of scattering it across five docs pages.

---

## Some concepts first

### Cloudflare Concepts

**What is a Cloudflare Worker?**

When you visit a website, your browser sends a request to a server somewhere, and that server sends back HTML, CSS, images — the stuff your browser renders into a page. Traditionally, that server is a machine (physical or virtual) running 24/7 in a data center.

A Cloudflare Worker is different. Instead of a dedicated server, your code runs on Cloudflare's network — which spans over 300 cities worldwide. When someone visits your site, Cloudflare runs your code on whichever server is closest to that visitor. There's no single machine to maintain, no operating system to patch, no "server" in the traditional sense. You upload your code, Cloudflare runs it at the edge.

For a static site like this one (pre-rendered HTML files), the Worker is essentially a smart file server that happens to be globally distributed.

**What is Wrangler?**

Wrangler is Cloudflare's command-line tool. It's how you deploy code to Workers, manage configuration, and preview your site locally. When I run `npm run deploy`, that's really running `wrangler deploy` under the hood — it bundles up the site's `dist/` folder and pushes it to Cloudflare's network.

Think of it like `git push`, but instead of pushing code to GitHub, you're pushing a deployable site to Cloudflare.

**The workers.dev subdomain**

Every Worker gets a free URL automatically: `your-worker-name.your-account.workers.dev`. Mine was `sreemanxyz.sreeharshamandlem.workers.dev`. This is useful for testing, but it's not something you'd put on a business card.

The `workers.dev` domain belongs to Cloudflare. It's their default address space for Workers, like how every GitHub repo gets a `username.github.io` URL. You can use it indefinitely, but to use your own domain name, you need to tell Cloudflare: "when someone visits `sreeman.xyz`, send them to this Worker."

### Networking

**What are nameservers and DNS?**

Every domain name — `google.com`, `sreeman.xyz`, `wikipedia.org` — is really just a human-friendly alias for an IP address (a number like `104.21.18.5`). The system that translates domain names to IP addresses is called **DNS** (Domain Name System).

When you type `sreeman.xyz` in a browser, your computer asks a DNS server: "What IP address does `sreeman.xyz` point to?" The answer comes from **nameservers** — the authoritative source of truth for a domain's DNS records.

When you buy a domain, your registrar sets default nameservers. By pointing your nameservers to Cloudflare(my registrar), you're saying: "Cloudflare is in charge of answering all DNS questions about my domain." This is what lets Cloudflare route traffic to your Worker, manage SSL certificates, and apply all the other settings.

Since I bought my domain through Cloudflare Registrar, the nameservers were already pointing to Cloudflare. If you buy from somewhere else (Namecheap, GoDaddy, etc.), you'll need to log in to your registrar and change the nameservers to the ones Cloudflare gives you.

**SSL, TLS, and HTTPS — what's the difference?**

Before explaining the next setting, a quick primer on these three acronyms that people use interchangeably:

- **SSL** (Secure Sockets Layer) was the original protocol for encrypting web traffic. It was invented in the mid-1990s by Netscape. It's been deprecated for years because of security vulnerabilities.
- **TLS** (Transport Layer Security) is SSL's successor. It's what actually runs today. When someone says "SSL certificate," they almost always mean a TLS certificate. The name stuck even though the technology moved on.
- **HTTPS** is just HTTP (the protocol browsers use to load web pages) with TLS encryption wrapped around it. The `S` stands for "Secure." When you see the padlock icon in your browser's address bar, that means the connection is using HTTPS (i.e., HTTP over TLS).

In short: SSL is the old name, TLS is the current technology, HTTPS is what you see in the browser. They're all part of the same story — encrypting the connection between a browser and a server so no one in the middle can read or tamper with the data.

**Apex Domain**

The addresses `sreeman.xyz` vs `www.sreeman.xyz` are technically two different addresses, even though they feel like the same thing.

- `sreeman.xyz` is called the **apex** domain (also called the "root" or "bare" domain). It's the domain exactly as you bought it — nothing before it.
- `www.sreeman.xyz` is a **subdomain**. The `www` part is a leftover convention from the early web when it was common to separate web traffic from other services like `mail.example.com` or `ftp.example.com`.

By default, if you only set up `sreeman.xyz`, someone typing `www.sreeman.xyz` would get an error — the browser would have no idea where to send that request. That's why you need to handle both, even if you prefer one over the other.

---

## What I changed and why

### 1. Added the custom domain to the Worker

**Where:** Workers & Pages → sreemanxyz → Settings → Domains & Routes → Add → Custom Domain

**What I entered:** `sreeman.xyz` and `www.sreeman.xyz`

**Why:** A Worker only responds on its `*.workers.dev` address by default. Adding a custom domain creates a connection between your domain and your Worker — Cloudflare creates the necessary DNS records automatically and provisions an SSL certificate so HTTPS works immediately.

I added both `sreeman.xyz` and `www.sreeman.xyz` so that traffic to either address reaches the Worker. Without the `www` version, anyone who types (or clicks a link to) `www.sreeman.xyz` would see an error page.

### 2. How Cloudflare handles HTTPS and certificates

Normally, to enable HTTPS on a website, you need an **SSL/TLS certificate** — a digital file that proves your server is who it claims to be. Getting one used to involve paying a certificate authority, generating cryptographic keys, and installing the certificate on your server. Then you had to renew it every year (or every 90 days with free providers like Let's Encrypt).

Cloudflare does all of this for you automatically. When you add a domain to Cloudflare:
- They issue a certificate for your domain
- They install it on their edge servers
- They renew it before it expires
- You don't touch any of it

This is one of those "it just works" things. The moment I added `sreeman.xyz` as a custom domain to my Worker, HTTPS was active. No key generation, no certificate signing requests, no cron jobs for renewal.

### 3. SSL/TLS mode: Full (strict)

**Where:** SSL/TLS → Overview → Configure

**What I selected:** Full (strict)

**Why:** This setting controls what happens *between* Cloudflare and your origin (the Worker). Think of it as two hops:

```
Browser ──HTTPS──▶ Cloudflare ──???──▶ Your Worker
```

The "???" is what this setting controls:

- **Flexible** — The second hop is unencrypted (HTTP). Your visitor sees a padlock, but the connection between Cloudflare and your server is wide open. It looks secure but has a blind spot.
- **Full** — Both hops are encrypted, but Cloudflare doesn't verify the certificate on the second hop. Like calling a phone number and trusting whoever picks up.
- **Full (strict)** — Both hops encrypted, and Cloudflare verifies the origin certificate is valid. The complete chain is secured.

Since Cloudflare Workers handle TLS termination natively (they're part of Cloudflare's own infrastructure), Full (strict) works out of the box with no extra configuration.

### 5. Always Use HTTPS

**Where:** SSL/TLS → Edge Certificates → Always Use HTTPS → On

**Why:** Without this, if someone types `http://sreeman.xyz` (note: no `s`) in their browser, they'd get the unencrypted version. With this toggle on, Cloudflare automatically redirects every HTTP request to HTTPS. The visitor ends up on the secure version without knowing or caring about the difference.

There's no reason to leave this off. Every request should be encrypted.

### 6. The www → apex redirect rule

**Where:** Rules → Redirect Rules → Create Rule

First, a quick vocabulary note: **apex** means the root domain — `sreeman.xyz` without any prefix. It's called the apex because it's the top of your domain's hierarchy. Everything else (`www.sreeman.xyz`, `blog.sreeman.xyz`, `api.sreeman.xyz`) branches off from it.

**What I configured:**
- **When:** Hostname equals `www.sreeman.xyz`
- **Then:** Redirect to `https://sreeman.xyz` + the original path
- **Status code:** 301 (permanent redirect)

**Why:** Even though both `sreeman.xyz` and `www.sreeman.xyz` reach the same Worker and serve the same content, that's actually a problem. Here's why:

Search engines like Google treat `sreeman.xyz/blog` and `www.sreeman.xyz/blog` as two different pages. If both are live and serving identical content, Google sees duplicate content — the same article at two URLs. Google's response is to either pick one arbitrarily (which might not be the one you want) or penalize both for the duplication by ranking them lower.

The fix is to pick one as the "real" URL and redirect the other to it. I chose the apex domain (`sreeman.xyz`) because:
- The domain is short enough that `www.` adds clutter without adding clarity
- The `www.` prefix is a convention from the 1990s that most modern sites have dropped

The 301 status code means "permanently moved." It tells browsers and search engines: "stop looking at `www.sreeman.xyz` — the real address is `sreeman.xyz`. Update your bookmarks and your index."

### 7. Updated the Astro site config

**Where:** `astro.config.mjs`

**What changed:**
```js
// Before
site: "https://example.com"

// After
site: "https://sreeman.xyz"
```

**Why this matters more than you'd think:** Astro uses this `site` value in several places that affect how your site appears to the rest of the internet:

- **Canonical URLs** — A canonical URL is an HTML tag (`<link rel="canonical">`) that tells search engines: "this is the official address for this page." If your content appears at multiple URLs (which happens more often than you'd think — with trailing slashes, query parameters, `www` variants, etc.), the canonical tag says "ignore the others, this one is the real one." With `example.com` as the site URL, every page on my site was telling Google that its real address was on `example.com` — a domain I don't own.

- **Sitemap** — A sitemap is an XML file that lists every page on your site. You submit it to search engines so they know what pages exist and can crawl them. The `@astrojs/sitemap` plugin generates this automatically, but every URL in it was pointing to `example.com`.

- **Open Graph meta tags** — When you share a link on Twitter, LinkedIn, or Slack, those platforms read special `<meta>` tags from your page to generate the preview card (title, description, image, URL). The URL in those tags was `example.com/blog/...` instead of `sreeman.xyz/blog/...`.

- **RSS feed** — Same issue. The RSS feed listed `example.com` as the source.

None of this breaks the site visually — visitors see the right content. But behind the scenes, every automated system that reads your site's metadata was getting the wrong address. It's the kind of thing that silently undermines your site's discoverability for weeks before you notice.

---

## What I didn't change

**Wrangler config routes.** You can add `routes` to `wrangler.json` to manage custom domains in code instead of the dashboard. I used the dashboard because it's a one-time setup and I wanted to see exactly what Cloudflare was doing. If I end up managing multiple Workers with subdomains, I'll move to config-as-code.

**Cache settings.** Cloudflare's default caching for static assets is fine for now. The Worker serves pre-rendered HTML and static files, and Cloudflare caches them at the nearest edge server automatically.

## One more thing: disable the workers.dev subdomain

After setting up the custom domain, I noticed that the old `sreemanxyz.sreeharshamandlem.workers.dev` URL was still serving the site. That's the default behavior — Cloudflare keeps the `workers.dev` subdomain active even after you add a custom domain.

This is the same duplicate content problem again, just wearing a different hat. Your site is now accessible at two completely separate domains: `sreeman.xyz` and `sreemanxyz.sreeharshamandlem.workers.dev`. Search engines might index both. Canonical tags point to `sreeman.xyz`, but why leave the door open?

The fix is simple:

1. Go to **Workers & Pages** → `sreemanxyz` → **Settings** → **Domains & Routes**
2. Find the `sreemanxyz.sreeharshamandlem.workers.dev` entry
3. Click **Disable**

Now all traffic goes through `sreeman.xyz` exclusively. The `workers.dev` URL returns nothing. Clean.

---

## How traffic flows now

Here's the complete journey when someone visits the site:

1. Someone types `www.sreeman.xyz/blog` in their browser
2. The browser asks DNS: "where is `www.sreeman.xyz`?" DNS answers with Cloudflare's IP (because nameservers point to Cloudflare)
3. The request hits Cloudflare's nearest edge server
4. "Always Use HTTPS" upgrades to HTTPS if the request came in over HTTP
5. The redirect rule fires: 301 → `https://sreeman.xyz/blog`
6. The browser follows the redirect and requests `https://sreeman.xyz/blog`
7. Cloudflare routes `sreeman.xyz` to the `sreemanxyz` Worker
8. The Worker serves the pre-rendered HTML from its asset store
9. Cloudflare caches the response at the edge for future visitors in the same region

For cached content, this all happens in under 100ms. Not bad for a few toggle switches and a text field.

---

## How Cloudflare's serverless edge makes this work

All of this — the DNS resolution, the SSL termination, the redirects, the Worker execution, the caching — happens without a single server that I own, rent, or maintain. That's worth pausing on, because it's a fundamentally different model from how web hosting worked for most of the internet's life.

### The old way: you rent a server

Traditionally, putting a site on the internet meant renting a server (or a virtual machine) in a data center. You'd install an operating system, set up a web server like Nginx or Apache, configure SSL certificates, point your domain at the server's IP address, and hope nothing crashed at 3 a.m. If your visitors were in Tokyo and your server was in Virginia, every request traveled across the Pacific. If traffic spiked, your single server got overwhelmed. Scaling meant renting more servers and putting a load balancer in front of them.

You were responsible for everything: the OS updates, the certificate renewals, the disk space, the firewall rules, the logs, the backups. The "server" was the center of the universe, and everything else orbited around it.

### The new way: there is no server (sort of)

Cloudflare's model flips this. Instead of one server in one place, your code runs on Cloudflare's **edge network** — a mesh of data centers in over 300 cities across 100+ countries. There's no single origin server. There's no machine with an IP address that you SSH into. Your code is deployed everywhere simultaneously.

When a visitor in Berlin requests `sreeman.xyz`, the request never leaves Europe. It hits a Cloudflare data center in Frankfurt (or Berlin itself), your Worker runs there, and the response goes back. A visitor in São Paulo hits a server in Brazil. A visitor in Mumbai hits one in India. The code is the same everywhere; only the location changes.

This is what "serverless" means in practice — not that there are literally no servers, but that you never think about them. You don't provision them, you don't scale them, you don't patch them. They exist, somewhere, in large numbers, but they're Cloudflare's problem.

### Why "edge" matters

The word "edge" refers to the physical proximity to the end user. Traditional cloud services (AWS Lambda, for instance) run in a handful of regions — you might pick `us-east-1` or `eu-west-1`, and all your traffic routes there. Cloudflare Workers run at the **edge** of the network, meaning the server that handles your request is the one closest to you geographically.

For a content site like this one, that means:
- **DNS resolution** happens at the nearest Cloudflare node
- **SSL/TLS termination** happens there too — the encrypted connection ends at the edge, not at a far-away origin
- **Redirect rules** (like the `www` → apex rule) execute at the edge before the request goes anywhere else
- **Cached content** is served directly from the edge — the Worker doesn't even need to run for repeat visits
- **Worker execution** for uncached requests happens at that same edge node

Everything that used to require a centralized server now happens at the closest point to the visitor. That's why the total response time is under 100ms for most requests — the data barely has to travel.

### What this costs

For a personal portfolio and blog, the answer is: effectively nothing. Cloudflare Workers has a free tier that covers 100,000 requests per day. The custom domain, DNS, SSL certificates, caching, and DDoS protection are all included in Cloudflare's free plan. The only thing I paid for is the domain name itself.

This is a genuine shift. Ten years ago, running a site with global edge caching, automatic SSL, and serverless compute would have required an enterprise contract. Now it's the default for a free-tier side project.

---

## Subdomains for future projects

Since `sreeman.xyz` is meant to host more than just the portfolio, the plan is to use subdomains for other projects — `api.sreeman.xyz`, `lab.sreeman.xyz`, and so on. Each would be its own Worker with its own custom domain. Cloudflare makes this straightforward: add a custom domain to the new Worker, and it handles the DNS records and SSL certificates automatically. Same zone, different Workers, different codebases.

## The checklist

If you're doing the same thing — deploying an Astro site (or any site) to Cloudflare Workers with a custom domain — here's the short version:

1. Add your domain to Cloudflare (change nameservers if not using CF Registrar)
2. Add the custom domain to your Worker (dashboard or `wrangler.json`)
3. Add the `www` variant too
4. SSL/TLS → Full (strict)
5. Always Use HTTPS → On
6. Create a redirect rule: `www` → apex (or the reverse, pick one)
7. Update your framework's site URL config
8. Deploy

Fifteen minutes of configuration, and the site went from a temporary address to a real one.
