---
title: "NGINX, Security Groups, and Everything That Broke (Part 2: EC2 Setup)"
description: "The server-side half of putting an EC2 app behind Cloudflare — NGINX config, AWS Security Group lockdown, redirect loops, and debugging 521/522 errors."
date: 2026-03-22
---

This is the second part of setting up `timo.sreeman.xyz` — a Cloudflare-proxied subdomain pointing to an EC2 instance running NGINX.

[Part 1](/experiments/cloudflare-ec2-nginx-proxy) covers the Cloudflare side: what a reverse proxy is, how DNS A records and proxy mode work, SSL modes, and generating an origin certificate. If you haven't read it, start there — this post assumes you already have the DNS record, the SSL mode set to Full (Strict), and the origin certificate files on your server.

This part is about what happened when I tried to actually make NGINX serve traffic over HTTPS, and the three separate things that broke before it worked.

---

## The NGINX config

The goal was simple: NGINX should serve the app over HTTPS using the Cloudflare origin certificate, and redirect any HTTP traffic to HTTPS.

Here's what the final, working config looks like:

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

Straightforward, right? It took me three attempts to get here.

---

## What broke (and why)

### Mistake 1: The redirect loop

My first attempt had the HTTPS block proxying requests back to port 80:

```nginx
server {
    listen 443 ssl;
    server_name timo.sreeman.xyz;
    ssl_certificate     /etc/ssl/cloudflare/timo.pem;
    ssl_certificate_key /etc/ssl/cloudflare/timo.key;

    location / {
        proxy_pass http://127.0.0.1:80;  # ← this was the problem
    }
}
```

I thought this made sense — the app was already being served on port 80, so just forward HTTPS traffic to it. But the port 80 block had `return 301 https://...`, which sent the request right back to 443, which proxied it to 80 again, which redirected to 443... infinite loop.

Cloudflare returned `HTTP/2 301` with a `location` header pointing to the exact same URL. The browser gave up after a few cycles.

**The lesson:** If NGINX is serving static files (not proxying to a separate application on another port), use `root` directly. Only use `proxy_pass` when there's an actual app process listening on that port — like a Node.js server on 3000 or a Java app on 8080.

### Mistake 2: The config that NGINX ignored

After fixing the redirect loop, I reloaded NGINX and checked `sudo ss -tlnp | grep 443` — nothing. NGINX wasn't listening on port 443. But `sudo nginx -t` said the config was fine, and `systemctl status nginx` showed it running.

The problem was the config file location. I'd put it in `/etc/nginx/sites-available/timo` with a symlink in `/etc/nginx/sites-enabled/` — the Ubuntu/Debian convention. But this was Amazon Linux 2023, and the default `nginx.conf` doesn't include `sites-enabled/`. It only includes:

```
include /etc/nginx/conf.d/*.conf;
```

NGINX silently skipped my entire configuration. The syntax check passed because there was nothing wrong with `nginx.conf` itself — it just never loaded my server blocks.

**The fix:**
```bash
sudo cp /etc/nginx/sites-available/timo /etc/nginx/conf.d/timo.conf
sudo nginx -t && sudo systemctl reload nginx
```

**How to check what your NGINX actually includes:**
```bash
grep -n "include" /etc/nginx/nginx.conf
```

If you don't see `sites-enabled` in the output, that directory is decoration.

### Mistake 3: The firewall (Security Group)

Even after fixing NGINX, Cloudflare returned a **522 — Connection timed out**. The DNS was resolving, Cloudflare was trying to connect, but the TCP connection to port 443 was being silently dropped.

The cause: my EC2 Security Group only had port 80 open. I'd never needed 443 before.

---

## AWS Security Groups

A Security Group is a firewall for your EC2 instance. It's an allowlist — anything not explicitly permitted is blocked. There are no "deny" rules; if a port/source isn't listed, traffic is dropped silently.

**Where to find it:** AWS Console → **EC2** → select your instance → **Security** tab → click the Security Group name.

### The rules I ended up with

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | My IP | Server management |
| HTTP | 80 | Cloudflare IPs | NGINX redirects to HTTPS |
| HTTPS | 443 | Cloudflare IPs | Main traffic path |

### Why Cloudflare IPs and not `0.0.0.0/0`?

Opening ports to `0.0.0.0/0` means the entire internet can connect. That works, but it defeats the point of hiding behind Cloudflare — anyone who discovers the EC2 IP could bypass the proxy entirely.

By restricting ports 80 and 443 to only Cloudflare's IP ranges, direct access to the IP address is blocked. The only way to reach the app is through the subdomain, through Cloudflare's proxy.

Cloudflare publishes their IP ranges at [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4/). There are 15 CIDR blocks:

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

Each needs to be added as a separate Security Group inbound rule (AWS doesn't let you paste a list). That's 15 entries for port 443 and 15 for port 80 — tedious but one-time.

### CIDR notation, briefly

`173.245.48.0/20` means "every IP from `173.245.48.0` to `173.245.63.255`." The `/20` is the prefix length — it says the first 20 bits are fixed, and the remaining 12 bits can vary. Shorter prefix = bigger range. `/32` is a single IP, `/0` is the entire internet.

### Managed Prefix Lists

AWS has a feature called **Managed Prefix Lists** (under **VPC** → **Managed Prefix Lists**) that lets you group CIDR blocks into a named list and reference it in Security Group rules. In theory, this would let you add all 15 Cloudflare ranges once and reference the list in two rules instead of thirty.

In practice, you can't convert existing CIDR rules to prefix list rules — you have to delete the old rules first and create new ones. Useful to know for next time.

---

## Debugging Cloudflare 5xx errors

Here's the mental model that saved me time. When you `curl -I https://timo.sreeman.xyz`, look at the response headers:

**If you see `server: cloudflare` and a `cf-ray` header:**
Cloudflare received the request and tried to forward it to your origin. The problem is between Cloudflare and your EC2.

- **522** = Cloudflare's TCP connection to your server timed out → check Security Group, is the port open?
- **521** = Cloudflare connected but got no response → check NGINX, is it actually listening?
- **520** = NGINX responded with something Cloudflare couldn't parse → check NGINX error logs

**If you DON'T see `server: cloudflare`:**
The request never reached Cloudflare. Your DNS record is probably wrong or not proxied.

**If you see a 301 that loops to itself:**
Your origin is redirecting in a circle. Check whether NGINX's HTTPS block is accidentally sending traffic back to HTTP.

---

## The final result

After all three fixes, `curl -I https://timo.sreeman.xyz` returned:

```
HTTP/2 200
server: cloudflare
cf-ray: 9e08858779c7dbc3-FRA
```

The traffic flows through Cloudflare, NGINX serves the app over HTTPS with the origin certificate, the EC2 IP is hidden, and direct access is blocked by the Security Group.

It's a lot of moving parts for what amounts to "put a domain in front of a server." But each piece solves a specific problem, and once it's set up, there's nothing to maintain — the origin cert lasts 15 years, the Security Group rules don't change, and Cloudflare handles renewal of the public-facing certificate automatically.

---

## Quick reference

| What | Where to find it |
|------|-----------------|
| EC2 Security Groups | AWS Console → **EC2** → instance → **Security** tab |
| Managed Prefix Lists | AWS Console → **VPC** → **Managed Prefix Lists** |
| Cloudflare IP ranges | [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4/) |
| NGINX config (Amazon Linux) | `/etc/nginx/conf.d/*.conf` |
| NGINX config test | `sudo nginx -t` |
| Check listening ports | `sudo ss -tlnp` |
| NGINX error log | `/var/log/nginx/error.log` |
