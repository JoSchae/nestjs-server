# Cloudflare SSL Error 526 Fix

## Problem

Cloudflare Error 526 occurs when Cloudflare cannot validate the SSL certificate on your origin server.

## Current Setup Analysis

- Your Let's Encrypt certificate is valid until Sep 29 2025
- Nginx configuration is correct
- The issue is likely SSL/TLS mode configuration in Cloudflare

## Solutions (Choose One)

### Option 1: Use Cloudflare Origin Certificates (Recommended)

1. **Create Cloudflare Origin Certificate:**

    - Go to Cloudflare Dashboard
    - Navigate to SSL/TLS → Origin Certificates
    - Click "Create Certificate"
    - Use these settings:
        - Hostnames: `schaeferdevelopment.tech, *.schaeferdevelopment.tech`
        - Certificate Validity: 15 years
        - Key type: RSA (2048)

2. **Download and Install:**

    - Download the certificate (.pem) and private key (.key)
    - Replace the Let's Encrypt certificates in your setup

3. **Update nginx configuration:**
    ```nginx
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    ```

### Option 2: Change Cloudflare SSL Mode

1. **Go to Cloudflare Dashboard** → SSL/TLS → Overview
2. **Change SSL/TLS encryption mode from "Full (strict)" to "Full"**
    - This allows Cloudflare to connect to your origin with any valid certificate

### Option 3: Use Flexible SSL (Temporary Fix)

1. **Go to Cloudflare Dashboard** → SSL/TLS → Overview
2. **Change SSL/TLS encryption mode to "Flexible"**
    - This encrypts traffic between visitors and Cloudflare only
    - Less secure but will resolve the immediate issue

## Recommended Implementation

Since you're using Docker, here's how to implement Option 1:

1. Create the Origin Certificate in Cloudflare
2. Save the certificates to your host system
3. Mount them into your nginx container
4. Update the nginx configuration

## Next Steps

Choose Option 2 (change to "Full" mode) for the quickest fix, then implement Option 1 for the most secure long-term solution.
