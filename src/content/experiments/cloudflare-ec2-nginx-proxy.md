---
title: "Routing a Cloudflare Subdomain to an EC2 NGINX Server"
description: "Step-by-step learnings from setting up a Cloudflare-proxied subdomain pointing to an EC2 instance running NGINX, with origin SSL and locked-down security groups."
date: 2026-03-22
---

## What I was trying to do

I had a project (Timo) running on an AWS EC2 instance, accessible only via a raw IP address: `http://203.0.113.50`. I wanted to put it behind a proper subdomain — `timo.sreeman.xyz` — with HTTPS, DDoS protection, and the EC2's IP hidden from the public internet.

The setup: **Cloudflare (DNS + proxy) → EC2 (NGINX + origin SSL)**.

This post documents every concept I had to learn, every mistake I made, and where to find the relevant settings.

---

## The building blocks

### What is a reverse proxy?

A reverse proxy sits between the internet and your server. Instead of users connecting directly to your EC2, they connect to Cloudflare, which forwards the request to EC2 on their behalf. The user never sees your server's real IP address.

In this setup, Cloudflare is the reverse proxy. NGINX on EC2 is the origin server.

### Cloudflare proxy mode (orange cloud vs gray cloud)

When you add a DNS record in Cloudflare, there's a toggle for **Proxy status**:

- **Proxied (orange cloud)** — Traffic flows through Cloudflare. You get free SSL, caching, DDoS protection, and your server IP is hidden. A DNS lookup for `timo.sreeman.xyz` returns Cloudflare's IP, not yours.
- **DNS only (gray cloud)** — Cloudflare just resolves the domain to your IP. No protection, no caching, no free SSL. Anyone can see your server's real IP with a simple `dig` or `nslookup`.

**Where to find it:** Cloudflare Dashboard → your domain → **DNS** → **Records**. The proxy toggle is the orange/gray cloud icon next to each record.

### What is an A record?

An A record maps a domain name to an IPv4 address. When I created:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `timo` | `203.0.113.50` | Proxied |

...it told Cloudflare: "When someone requests `timo.sreeman.xyz`, route the traffic to this IP address."

**Where to find it:** Cloudflare Dashboard → your domain → **DNS** → **Records** → **Add Record**.

---

## SSL: the chain of trust

### The three hops

When a user visits `https://timo.sreeman.xyz`, there are two SSL connections:

1. **User → Cloudflare** — Cloudflare presents a public SSL certificate. Browsers trust it because it's issued by a recognized certificate authority. This happens automatically — you don't configure anything.
2. **Cloudflare → EC2** — Cloudflare connects to your origin server. This is where the SSL mode matters.

### SSL modes in Cloudflare

| Mode | What it means |
|------|--------------|
| **Off** | No encryption at all. Don't use this. |
| **Flexible** | User → Cloudflare is HTTPS, but Cloudflare → EC2 is plain HTTP. Better than nothing, but your origin traffic is unencrypted. |
| **Full** | Cloudflare → EC2 uses HTTPS, but accepts any certificate (including self-signed). |
| **Full (Strict)** | Cloudflare → EC2 uses HTTPS and requires a valid certificate — either a public CA cert or a Cloudflare Origin Certificate. Most secure. |

**Where to find it:** Cloudflare Dashboard → your domain → **SSL/TLS** → **Overview**.

### What is a Cloudflare Origin Certificate?

It's a free SSL certificate issued by Cloudflare specifically for the connection between Cloudflare and your origin server. It's **not trusted by browsers** — if someone hits your EC2 IP directly, they'll see a certificate warning. But that's the point: only Cloudflare-proxied traffic should reach your server.

**Where to generate it:** Cloudflare Dashboard → your domain → **SSL/TLS** → **Origin Server** → **Create Certificate**.

When generating:
- Choose **RSA (2048)** for key type
- Add your subdomain(s) to the hostnames list (e.g., `timo.sreeman.xyz` or `*.sreeman.xyz` for a wildcard)
- Set validity to 15 years (the default)
- **Copy both the certificate and private key immediately** — the private key is shown only once

On the server, I stored them as:
```
/etc/ssl/cloudflare/timo.pem    # the certificate
/etc/ssl/cloudflare/timo.key    # the private key (chmod 600)
```

---

## NGINX configuration

### The mistake I made

My first NGINX config looked like this:

```nginx
server {
    listen 80;
    server_name timo.sreeman.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name timo.sreeman.xyz;
    ssl_certificate     /etc/ssl/cloudflare/timo.pem;
    ssl_certificate_key /etc/ssl/cloudflare/timo.key;

    location / {
        proxy_pass http://127.0.0.1:80;  # ← THE PROBLEM
    }
}
```

The HTTPS block proxied to `127.0.0.1:80`, which hit the HTTP block, which redirected back to HTTPS. **Infinite redirect loop.** Cloudflare returned a 301 that pointed to itself.

### The fix

My app was being served as static files by NGINX's default server block from `/usr/share/nginx/html`. There was no separate app process — NGINX _was_ the app. So instead of proxying, the 443 block needed to serve the files directly:

```nginx
server {
    listen 80;
    server_name timo.sreeman.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name timo.sreeman.xyz;
    ssl_certificate     /etc/ssl/cloudflare/timo.pem;
    ssl_certificate_key /etc/ssl/cloudflare/timo.key;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

**Lesson:** Know whether your NGINX is a _reverse proxy_ (forwarding to an app on another port) or a _file server_ (serving static content directly). The config is fundamentally different.

### Amazon Linux uses `conf.d/`, not `sites-enabled/`

On Ubuntu/Debian, NGINX convention is `sites-available/` and `sites-enabled/` with symlinks. On Amazon Linux 2023, the default `nginx.conf` only includes:

```
include /etc/nginx/conf.d/*.conf;
```

I initially put my config in `sites-enabled/` and NGINX silently ignored it — the syntax check passed, but it never loaded. The fix: place config files in `/etc/nginx/conf.d/` with a `.conf` extension.

**How to check what your NGINX includes:**
```bash
grep -n "include" /etc/nginx/nginx.conf
```

---

## AWS Security Groups

### What is a Security Group?

A Security Group is a virtual firewall for your EC2 instance. It controls which traffic can reach your instance (inbound rules) and which traffic can leave (outbound rules). Think of it as an allowlist — anything not explicitly permitted is blocked.

**Where to find it:** AWS Console → **EC2** → select your instance → **Security** tab → click the Security Group name.

### The rules I needed

| Type | Port | Source | Why |
|------|------|--------|-----|
| SSH | 22 | My IP (or `0.0.0.0/0` if needed) | Server management |
| HTTP | 80 | Cloudflare IP ranges | NGINX redirects HTTP → HTTPS |
| HTTPS | 443 | Cloudflare IP ranges | Main traffic path |

### Locking down to Cloudflare IPs only

Instead of opening ports 80/443 to the entire internet (`0.0.0.0/0`), I restricted them to Cloudflare's IP ranges. This means:

- `https://timo.sreeman.xyz` → **works** (traffic comes from Cloudflare IPs)
- `http://203.0.113.50` → **blocked** (direct access from non-Cloudflare IPs)

Cloudflare publishes their IP ranges at [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4/). As of this writing:

```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

Each CIDR block needs to be added as a separate inbound rule in the Security Group. It's tedious (15 entries × 2 ports = 30 rules), but it's a one-time setup.

**What is CIDR notation?** `173.245.48.0/20` means "all IP addresses from `173.245.48.0` to `173.245.63.255`". The `/20` is the prefix length — it defines how many bits of the address are fixed. Smaller prefix = larger range (`/8` is huge, `/32` is a single IP).

### Prefix Lists

AWS supports **Managed Prefix Lists** — named groups of CIDR blocks that you can reference in Security Group rules instead of adding each block individually. However, you can't mix prefix lists with existing CIDR rules in the same entry. You'd need to delete the old rules and create new ones referencing the prefix list.

**Where to find it:** AWS Console → **VPC** → **Managed Prefix Lists** → **Create Prefix List**.

---

## Debugging Cloudflare error codes

During setup, I hit two Cloudflare errors in sequence:

### 522 — Connection timed out

Cloudflare tried to reach my EC2 but the connection timed out. **Cause:** Port 443 wasn't open in the Security Group. Cloudflare could route the DNS, but the TCP connection was blocked at the AWS firewall.

**Fix:** Add HTTPS (443) inbound rule to the Security Group.

### 521 — Web server is down

Cloudflare connected to EC2, but nothing responded on port 443. **Cause:** NGINX config was in `sites-enabled/` which Amazon Linux doesn't include — so NGINX wasn't listening on 443 at all.

**Fix:** Move config to `/etc/nginx/conf.d/timo.conf` and reload NGINX.

### 301 redirect loop

Not a Cloudflare error per se, but NGINX returned a 301 redirect to the same URL. **Cause:** The HTTPS server block proxied to `localhost:80`, which hit the HTTP block, which redirected back to HTTPS.

**Fix:** Serve files directly with `root` instead of `proxy_pass` to port 80.

### How to distinguish Cloudflare errors from origin errors

If the response includes `server: cloudflare` and a `cf-ray` header, Cloudflare reached your DNS record and attempted to connect. The HTTP status code tells you where it failed:

- **5xx with `cf-ray`** = Cloudflare couldn't connect to your origin
- **4xx/5xx without `cf-ray`** = the request never reached Cloudflare (DNS issue)
- **200 with `cf-ray`** = everything is working end to end

---

## The final architecture

```
User (browser)
  │
  │  HTTPS (public Cloudflare cert)
  ▼
Cloudflare Edge (proxy, cache, DDoS protection)
  │
  │  HTTPS (origin certificate)
  ▼
EC2 Security Group (only Cloudflare IPs allowed)
  │
  ▼
NGINX (port 443, serves static files)
```

**What's protected:**
- EC2 IP is hidden — DNS lookups return Cloudflare's IP
- Direct IP access is blocked by Security Group rules
- Origin cert is only trusted by Cloudflare, not browsers — useless to attackers
- SSL is end-to-end encrypted (Full Strict mode)

---

## Quick reference: where to find things

| What | Where |
|------|-------|
| DNS records | Cloudflare → your domain → **DNS** → **Records** |
| SSL mode | Cloudflare → your domain → **SSL/TLS** → **Overview** |
| Origin certificates | Cloudflare → your domain → **SSL/TLS** → **Origin Server** |
| Redirect rules | Cloudflare → your domain → **Rules** → **Redirect Rules** |
| Cloudflare IP ranges | [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4/) |
| EC2 Security Groups | AWS Console → **EC2** → instance → **Security** tab |
| Managed Prefix Lists | AWS Console → **VPC** → **Managed Prefix Lists** |
| NGINX config (Amazon Linux) | `/etc/nginx/conf.d/*.conf` |
| NGINX config test | `sudo nginx -t` |
| Check listening ports | `sudo ss -tlnp` |
