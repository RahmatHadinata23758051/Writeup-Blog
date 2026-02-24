# Nginx/Server Configuration untuk SEO Best Practices
# Apply di production environment

# Enable Gzip compression for faster page loads
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml;
gzip_disable "msie6";

# Set proper cache headers untuk static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Cache HTML files untuk 1 jam (biarkan browser re-validate)
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
    add_header ETag "\"$file_mtime-$file_size\"";
}

# Don't cache dynamic API calls jika ada
location ~* \.(api|json)$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
}

# Security headers untuk SEO trust dan safety
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# HTTPS redirect (required for SEO)
server {
    listen 80;
    server_name ctfwriteups.example.com www.ctfwriteups.example.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name ctfwriteups.example.com www.ctfwriteups.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/ctfwriteups.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ctfwriteups.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /var/www/ctfwriteups/dist;
    index index.html;

    # Canonical redirect untuk www/non-www
    if ($host != "ctfwriteups.example.com") {
        return 301 https://ctfwriteups.example.com$request_uri;
    }

    # Enable HSTS untuk SEO trust score
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Sitemap dan robots.txt (high cache priority)
    location ~ (^/sitemap\.xml|^/robots\.txt) {
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
        access_log off;
    }

    # HTML files (validate before serving)
    location ~ \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # SPA routing - serve index.html untuk non-existent files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, must-revalidate";
    }

    # Block access ke private files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Error pages dengan proper status codes
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # Log configuration
    access_log /var/log/nginx/ctfwriteups_access.log;
    error_log /var/log/nginx/ctfwriteups_error.log warn;
}

---

# Alternative: Vercel vercel.json Configuration untuk Next.js/Vite

{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/sitemap.xml",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=604800"
        },
        {
          "key": "Content-Type",
          "value": "application/xml"
        }
      ]
    },
    {
      "source": "/robots.txt",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=604800"
        },
        {
          "key": "Content-Type",
          "value": "text/plain"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/sitemap",
      "destination": "/sitemap.xml",
      "permanent": false
    }
  ]
}
