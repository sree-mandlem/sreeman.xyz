---
title: "Putting an EC2 App Behind Cloudflare (Part 1: DNS, Proxy, and SSL)"
description: "How I set up a Cloudflare subdomain to route traffic to an EC2 instance — reverse proxies, A records, SSL modes, and origin certificates explained."
date: 2026-03-22
---

I had a small project running on an EC2 instance — nothing fancy, just NGINX serving static files. The only way to reach it was typing the public IP into a browser: `http://203.0.113.50`. No HTTPS, no domain, no protection. The kind of setup you leave "temporary" for six months.

I already had `sreeman.xyz` on Cloudflare, so the goal was straightforward: make the app available at `timo.sreeman.xyz`, with HTTPS and the server IP hidden from the internet.

This first part covers the Cloudflare side — the DNS, the proxy, and how SSL works across the chain. If you want the NGINX configuration, the AWS Security Group lockdown, and all the things that broke along the way, that's in [Part 2: NGINX, Security Groups, and Everything That Broke](/experiments/cloudflare-ec2-nginx-debugging). It covers the server-side setup, the 521/522 errors I hit, the redirect loop I created, and the Amazon Linux gotchas that cost me time.

---

## What is a reverse proxy?

Before any configuration, it helps to understand what Cloudflare actually does here.

A reverse proxy sits between your users and your server. When someone visits `timo.sreeman.xyz`, they're not connecting to my EC2 — they're connecting to Cloudflare. Cloudflare then forwards the request to EC2 behind the scenes and sends the response back.

The user never sees the real server. They just see Cloudflare.

This gives you a few things for free: SSL termination, DDoS protection, caching, and IP hiding. None of which I'd get by just pointing a DNS record at a bare IP.

---

## Adding the DNS record

The first step was telling Cloudflare where `timo.sreeman.xyz` should go.

In the Cloudflare dashboard, under **DNS → Records → Add Record**, I created:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `timo` | `203.0.113.50` | Proxied |

### What's an A record?

An A record is the most basic type of DNS record. It maps a domain name to an IPv4 address. The `Name` field is just the subdomain part — Cloudflare appends the domain automatically, so `timo` becomes `timo.sreeman.xyz`.

### Proxied vs DNS only

This is the toggle that matters most. When you create a DNS record in Cloudflare, there's an orange/gray cloud icon:

- **Proxied (orange cloud)** — All traffic flows through Cloudflare's network. DNS lookups for `timo.sreeman.xyz` return Cloudflare's IP addresses, not mine. Cloudflare handles SSL, caches static assets, and blocks malicious traffic before it ever reaches EC2.
- **DNS only (gray cloud)** — Cloudflare just tells the world where my server is. A simple `dig timo.sreeman.xyz` reveals `203.0.113.50`. No protection, no caching, no free SSL. It's just a phone book entry.

I went with proxied. The whole point was to hide the EC2 behind Cloudflare.

---

## SSL: how HTTPS works across the chain

This is where things get conceptual. When someone visits `https://timo.sreeman.xyz`, there are actually two separate SSL connections happening:

**Connection 1: User → Cloudflare**
Cloudflare presents a public SSL certificate to the browser. This certificate is automatically issued and renewed — I didn't configure anything. The browser trusts it because it comes from a recognized certificate authority.

**Connection 2: Cloudflare → EC2**
This is the one I had to think about. Cloudflare needs to connect to my origin server, and the security of that connection depends on the **SSL mode** I choose.

### The four SSL modes

| Mode | User → Cloudflare | Cloudflare → EC2 | When to use |
|------|-------------------|-------------------|-------------|
| **Off** | HTTP | HTTP | Never |
| **Flexible** | HTTPS | HTTP | When you can't install a cert on the server |
| **Full** | HTTPS | HTTPS (any cert) | When you have a self-signed cert |
| **Full (Strict)** | HTTPS | HTTPS (valid cert) | When you have a proper or Cloudflare origin cert |

I was already running `sreeman.xyz` on **Full (Strict)** — this is a domain-wide setting, not per-subdomain. So my EC2 needed a certificate that Cloudflare would accept.

**Where to set this:** Cloudflare Dashboard → your domain → **SSL/TLS** → **Overview**.

### The origin certificate

Cloudflare issues free certificates specifically for this purpose. They call them **Origin Certificates** — they encrypt the connection between Cloudflare and your server, but they're _not_ trusted by browsers. If someone visits your EC2 IP directly, they'll see a scary certificate warning. That's by design.

To generate one:

1. Cloudflare Dashboard → your domain → **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Choose **RSA (2048)** for key type
4. Add your subdomain to the hostnames (I used `timo.sreeman.xyz` — you could also use `*.sreeman.xyz` for a wildcard)
5. Set validity to 15 years
6. **Copy both the certificate and private key right now** — the private key is shown only once. If you close the page without copying it, you'll need to generate a new pair.

I saved them on the server as:
```
/etc/ssl/cloudflare/timo.pem    # the certificate
/etc/ssl/cloudflare/timo.key    # the private key (chmod 600)
```

---

## The architecture so far

At this point, the Cloudflare side was done. The intended traffic flow:

```
User (browser)
  │
  │  HTTPS (public Cloudflare cert, automatic)
  ▼
Cloudflare Edge (proxy + cache + DDoS shield)
  │
  │  HTTPS (origin certificate, installed on EC2)
  ▼
EC2 running NGINX (port 443)
```

Everything from here — configuring NGINX, opening the right ports, and fixing the three separate things that broke — is server-side work.

**→ Continue to [Part 2: NGINX, Security Groups, and Everything That Broke](/experiments/cloudflare-ec2-nginx-debugging)** for the NGINX configuration (and the redirect loop I accidentally created), locking down the AWS Security Group to only accept Cloudflare traffic, debugging the 521 and 522 errors, and the Amazon Linux gotcha that silently ignored my entire config file.

---

## Quick reference

| What | Where to find it |
|------|-----------------|
| DNS records | Cloudflare → your domain → **DNS** → **Records** |
| SSL mode | Cloudflare → your domain → **SSL/TLS** → **Overview** |
| Origin certificates | Cloudflare → your domain → **SSL/TLS** → **Origin Server** |
| Cloudflare IP ranges | [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4/) |
