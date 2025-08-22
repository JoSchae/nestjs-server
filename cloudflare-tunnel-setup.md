# Cloudflare Tunnel Setup Guide

## Overview

This guide explains how to set up Cloudflare Tunnel to bypass port forwarding and ISP restrictions. Cloudflare Tunnel creates a secure outbound connection from your server to Cloudflare, eliminating the need for:

- Port forwarding on your router
- Public IP accessibility
- DDNS services
- Complex firewall configurations

## Benefits of Cloudflare Tunnel

- ✅ **No port forwarding required** - bypasses ISP restrictions
- ✅ **Automatic SSL/TLS** - Cloudflare handles SSL termination
- ✅ **Enhanced security** - no open ports on your server
- ✅ **Better performance** - Cloudflare's global CDN
- ✅ **Free to use** - included with Cloudflare account

## Prerequisites

- Cloudflare account with your domain added
- Domain pointing to Cloudflare nameservers
- Server with Docker containers running

## Step-by-Step Setup

### 1. Install cloudflared

```bash
# Download and install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 2. Login to Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window for authentication. Complete the login process.

### 3. Create a Tunnel

```bash
cloudflared tunnel create your-tunnel-name
```

This creates a tunnel and saves credentials to `~/.cloudflared/`

### 4. Configure the Tunnel

Create a configuration file at `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/username/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
    - hostname: yourdomain.com
      service: http://localhost:80
    - hostname: www.yourdomain.com
      service: http://localhost:80
    - service: http_status:404
```

### 5. Update DNS Records

In your Cloudflare dashboard:

1. **Delete existing A records** for your domain
2. **Add CNAME records** pointing to your tunnel:
    - **Type:** CNAME
    - **Name:** @ (or your domain)
    - **Target:** `YOUR_TUNNEL_ID.cfargotunnel.com`
    - **Proxy status:** Proxied (orange cloud)

### 6. Start the Tunnel

```bash
# Test the tunnel
cloudflared tunnel run your-tunnel-name

# Run in background
nohup cloudflared tunnel run your-tunnel-name > /tmp/tunnel.log 2>&1 &
```

### 7. Setup as System Service (Recommended)

```bash
# Install as system service
sudo cloudflared service install

# Start the service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## SSL Certificate Setup for Full (Strict) Mode

### 1. Create Cloudflare Origin Certificate

1. Go to **Cloudflare Dashboard** → **SSL/TLS** → **Origin Certificates**
2. Click **"Create Certificate"**
3. Configure:
    - **Hostnames:** `yourdomain.com, *.yourdomain.com`
    - **Certificate Validity:** 15 years
    - **Key type:** RSA (2048)

### 2. Install Certificate Chain

```bash
# Download Cloudflare Origin CA
curl -s https://developers.cloudflare.com/ssl/static/origin_ca_rsa_root.pem > /tmp/cloudflare-origin-ca.pem

# Create certificate chain
sudo cat /etc/ssl/certs/cloudflare-origin.pem /tmp/cloudflare-origin-ca.pem > /etc/ssl/certs/cloudflare-origin-fullchain.pem
```

### 3. Update nginx Configuration

Use the Cloudflare-optimized nginx configuration:

```nginx
# Cloudflare Real IP configuration
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
# ... (all Cloudflare IP ranges)
real_ip_header CF-Connecting-IP;

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/cloudflare-origin-fullchain.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
}
```

## Troubleshooting

### Common Issues

1. **526 Error:** Usually DNS propagation - wait 5-10 minutes
2. **Connection timeout:** Check tunnel is running and configuration is correct
3. **SSL errors:** Ensure certificate chain is properly created

### Verify Setup

```bash
# Check tunnel status
cloudflared tunnel info your-tunnel-name

# Test connection
curl -I https://yourdomain.com

# Check tunnel logs
tail -f /tmp/tunnel.log
```

### Enable Full (Strict) SSL Mode

After setup is complete:

1. Go to **Cloudflare Dashboard** → **SSL/TLS** → **Overview**
2. Change encryption mode to **"Full (strict)"**
3. Verify your site loads correctly

## Security Benefits

- **Zero attack surface** - no open ports on your origin
- **DDoS protection** - Cloudflare filters malicious traffic
- **Web Application Firewall** - additional security layer
- **Rate limiting** - built-in protection against abuse
- **Always-on SSL** - automatic HTTPS enforcement
