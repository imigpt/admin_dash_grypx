# Admin Dashboard Deployment Guide

## 🚀 Current Deployment

**Live URL:** https://admindashgrypx.vercel.app  
**GitHub Repo:** https://github.com/imigpt/admin_dash_grypx  
**Backend API:** http://34.131.53.32:8080

---

## ⚠️ Mixed Content Security Issue

### The Problem
Your Vercel deployment uses **HTTPS** (`https://admindashgrypx.vercel.app`), but your GCP backend uses **HTTP** (`http://34.131.53.32:8080`). 

Browsers **block HTTP requests from HTTPS pages** for security reasons. This is called "Mixed Content" blocking.

### The Error
```
Mixed Content: The page at 'https://admindashgrypx.vercel.app' was loaded over HTTPS, 
but requested an insecure resource 'http://34.131.53.32:8080/api/auth/login'. 
This request has been blocked; the content must be served over HTTPS.
```

---

## ✅ Solutions (Choose One)

### Option 1: Enable HTTPS on Backend (Recommended)

You need to configure your GCP backend to use HTTPS. Here are the steps:

#### Using Google Cloud Load Balancer with SSL Certificate

1. **Create SSL Certificate:**
```bash
gcloud compute ssl-certificates create grypx-ssl-cert \
  --domains=api.grypx.com \
  --global
```

2. **Create HTTPS Load Balancer:**
```bash
# Create health check
gcloud compute health-checks create http grypx-health-check \
  --port=8080

# Create backend service
gcloud compute backend-services create grypx-backend \
  --protocol=HTTP \
  --health-checks=grypx-health-check \
  --global

# Add instance to backend
gcloud compute backend-services add-backend grypx-backend \
  --instance-group=grypx-instance-group \
  --instance-group-zone=asia-south2-b \
  --global

# Create URL map
gcloud compute url-maps create grypx-https-lb \
  --default-service=grypx-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create grypx-https-proxy \
  --url-map=grypx-https-lb \
  --ssl-certificates=grypx-ssl-cert

# Create forwarding rule
gcloud compute forwarding-rules create grypx-https-rule \
  --global \
  --target-https-proxy=grypx-https-proxy \
  --ports=443
```

3. **Update .env.production:**
```env
VITE_API_BASE_URL=https://api.grypx.com
```

#### Using Self-Signed Certificate (Quick Test)

**On your GCP VM:**

```bash
# Install Nginx
sudo apt-get update
sudo apt-get install nginx

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

**Nginx Config:**
```nginx
server {
    listen 443 ssl;
    server_name 34.131.53.32;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Then:**
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo ufw allow 443
```

**Update .env.production:**
```env
VITE_API_BASE_URL=https://34.131.53.32
```

---

### Option 2: Use Vercel as Proxy (Easier)

Create API routes in Vercel to proxy requests to your HTTP backend.

**Create `vercel.json` in project root:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://34.131.53.32:8080/api/:path*"
    }
  ]
}
```

**Update .env.production:**
```env
VITE_API_BASE_URL=https://admindashgrypx.vercel.app
```

**Pros:** No backend changes needed  
**Cons:** All API traffic goes through Vercel (may have latency)

---

### Option 3: Deploy HTTP Version Temporarily (Development Only)

For testing purposes only, you can deploy an HTTP version:

**Create `vercel-http.json`:**
```json
{
  "build": {
    "env": {
      "VITE_API_BASE_URL": "http://34.131.53.32:8080"
    }
  }
}
```

**Deploy to different URL:**
```bash
vercel --prod --name admindashgrypx-http
```

**⚠️ WARNING:** Browsers will still block this. Only use for local testing.

---

### Option 4: Disable Mixed Content (Browser Override - Development Only)

**Chrome Flag (NOT RECOMMENDED FOR PRODUCTION):**
```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
Add: http://34.131.53.32:8080
```

**⚠️ WARNING:** This only works on your browser. Real users will still get blocked.

---

## 🎯 Recommended Action Plan

### For Production (Best Practice)

1. **Set up HTTPS on GCP backend** using Load Balancer with SSL
2. **Get a domain name** (e.g., api.grypx.com)
3. **Update DNS** to point to Load Balancer IP
4. **Update .env.production** to use HTTPS URL
5. **Redeploy to Vercel**

### Quick Fix (Testing)

1. **Use Vercel proxy** (Option 2)
2. **Create vercel.json** with rewrite rules
3. **Push to GitHub**
4. **Vercel will auto-deploy**

---

## 📋 Current Configuration

### Environment Files

**.env** (Local Development)
```env
VITE_API_BASE_URL=http://34.131.53.32:8080
```

**.env.development**
```env
VITE_API_BASE_URL=http://localhost:8081
```

**.env.production** (Vercel)
```env
VITE_API_BASE_URL=http://34.131.53.32:8080
```

### Build Commands

**Local Development:**
```bash
npm run dev
# Uses .env.development
```

**Production Build:**
```bash
npm run build
# Uses .env.production
```

**Vercel Deployment:**
- Automatically uses `.env.production`
- Set environment variables in Vercel dashboard

---

## 🔧 Vercel Environment Variables

Go to: https://vercel.com/imigpt/admindashgrypx/settings/environment-variables

**Add:**
- Name: `VITE_API_BASE_URL`
- Value: `http://34.131.53.32:8080` (current) or `https://...` (after HTTPS setup)
- Environment: Production

---

## 🚨 Important Notes

1. **Mixed Content is a browser security feature** - you cannot bypass it in production
2. **HTTPS on backend is the proper solution**
3. **Self-signed certificates** will show browser warnings
4. **Vercel proxy** adds latency but works immediately
5. **Production apps MUST use HTTPS for APIs**

---

## 📞 Next Steps

1. Choose your solution (recommend Option 1 or Option 2)
2. Implement the changes
3. Update `.env.production`
4. Push to GitHub
5. Vercel will auto-deploy
6. Test at https://admindashgrypx.vercel.app

---

**Last Updated:** January 20, 2026  
**Status:** Deployed to Vercel, awaiting HTTPS backend setup
