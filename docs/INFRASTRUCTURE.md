# Infrastructure Document

## CapnStegg - Debian Server, Nginx Reverse Proxy & ProxyChains Configuration

---

## 1. Overview

This document outlines the infrastructure requirements and configurations for deploying CapnStegg in a production environment. The setup includes a Debian server with Nginx as a reverse proxy and ProxyChains for anonymity.

---

## 2. Server Requirements

### 2.1 Hardware Specifications

| Component   | Minimum       | Recommended    |
|-------------|---------------|----------------|
| CPU         | 2 cores       | 4 cores        |
| RAM         | 4 GB          | 8 GB           |
| Storage     | 50 GB SSD     | 100 GB SSD     |
| Network     | 100 Mbps      | 1 Gbps         |

### 2.2 Operating System

- **Distribution**: Debian 12 (Bookworm)
- **Architecture**: x86_64 (amd64)
- **Kernel**: 6.1 or later

---

## 3. Debian Server Setup

### 3.1 Initial Server Configuration

```bash
#!/bin/bash
# Initial server setup script

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
  curl \
  wget \
  git \
  vim \
  htop \
  ufw \
  fail2ban \
  unattended-upgrades

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3.2 Firewall Configuration (UFW)

```bash
#!/bin/bash
# Firewall configuration

# Reset UFW to defaults
sudo ufw --force reset

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### 3.3 Fail2Ban Configuration

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

---

## 4. Docker Installation

### 4.1 Install Docker

```bash
#!/bin/bash
# Docker installation for Debian

# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 5. Nginx Reverse Proxy

### 5.1 Install Nginx

```bash
#!/bin/bash
# Install Nginx

sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.2 Main Nginx Configuration

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Upstream Services
    upstream orchestration {
        server 127.0.0.1:3000;
        keepalive 32;
    }

    upstream steganography {
        server 127.0.0.1:3001;
        keepalive 32;
    }

    upstream ip_capture {
        server 127.0.0.1:3002;
        keepalive 32;
    }

    # Include virtual hosts
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### 5.3 CapnStegg Virtual Host Configuration

```nginx
# /etc/nginx/sites-available/capnstegg

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name capnstegg.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name capnstegg.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/capnstegg.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/capnstegg.example.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Connection limits
    limit_conn conn_limit 20;

    # Client body size for file uploads
    client_max_body_size 15M;

    # API Routes - Orchestration Service
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://orchestration/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Steganography Service (internal routing)
    location /internal/steganography/ {
        # Restrict to internal access only
        allow 127.0.0.1;
        deny all;
        
        proxy_pass http://steganography/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # IP Capture Service (internal routing)
    location /internal/ip-capture/ {
        # Restrict to internal access only
        allow 127.0.0.1;
        deny all;
        
        proxy_pass http://ip_capture/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check endpoint
    location /health {
        limit_req zone=general_limit burst=10 nodelay;
        
        proxy_pass http://orchestration/health;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 5.4 Enable Site and Test Configuration

```bash
#!/bin/bash
# Enable site and test configuration

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/capnstegg /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 6. SSL/TLS with Let's Encrypt

### 6.1 Install Certbot

```bash
#!/bin/bash
# Install Certbot

sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain Certificate

```bash
#!/bin/bash
# Obtain SSL certificate

# Replace with your domain
DOMAIN="capnstegg.example.com"

sudo certbot --nginx -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  --email admin@example.com \
  --redirect

# Test automatic renewal
sudo certbot renew --dry-run
```

---

## 7. ProxyChains Configuration

### 7.1 Install ProxyChains-NG

```bash
#!/bin/bash
# Install ProxyChains-NG

sudo apt install -y proxychains4
```

### 7.2 ProxyChains Configuration

```ini
# /etc/proxychains4.conf

# Strict chain - each connection through all proxies in order
strict_chain

# Quiet mode - no output
quiet_mode

# Proxy DNS requests through the proxy
proxy_dns

# Timeouts
tcp_read_time_out 15000
tcp_connect_time_out 8000

# Proxy list
# Format: type  host  port  [user pass]
[ProxyList]
# Add your proxies here
# SOCKS5 proxies recommended for better security
# socks5  127.0.0.1  9050  # Tor SOCKS proxy
# socks5  proxy1.example.com  1080  username  password
# socks5  proxy2.example.com  1080

# Example placeholder proxies (replace with real ones)
socks5  127.0.0.1  9050
```

### 7.3 Using ProxyChains with Services

```bash
# Run a command through proxy chain
proxychains4 curl https://api.example.com/endpoint

# Run Node.js service through proxy chain
proxychains4 node /path/to/service/index.js
```

### 7.4 Tor Integration (Optional)

```bash
#!/bin/bash
# Install and configure Tor for ProxyChains

# Install Tor
sudo apt install -y tor

# Enable and start Tor service
sudo systemctl enable tor
sudo systemctl start tor

# Verify Tor is running on port 9050
netstat -tlnp | grep 9050
```

---

## 8. Docker Compose Configuration

### 8.1 Production Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  orchestration:
    build:
      context: ./services/orchestration
      dockerfile: Dockerfile
    container_name: capnstegg-orchestration
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - capnstegg-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - steganography
      - ip-capture

  steganography:
    build:
      context: ./services/steganography-engine
      dockerfile: Dockerfile
    container_name: capnstegg-steganography
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - LOG_LEVEL=info
    ports:
      - "127.0.0.1:3001:3001"
    networks:
      - capnstegg-network
    volumes:
      - steganography-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ip-capture:
    build:
      context: ./services/ip-capture
      dockerfile: Dockerfile
    container_name: capnstegg-ip-capture
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3002
      - LOG_LEVEL=info
    ports:
      - "127.0.0.1:3002:3002"
    networks:
      - capnstegg-network
    volumes:
      - ip-capture-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: capnstegg-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - capnstegg-network
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

networks:
  capnstegg-network:
    driver: bridge

volumes:
  steganography-data:
  ip-capture-data:
  redis-data:
```

### 8.2 Development Docker Compose Override

```yaml
# docker-compose.dev.yml

version: '3.8'

services:
  orchestration:
    build:
      target: development
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./services/orchestration:/app
      - /app/node_modules

  steganography:
    build:
      target: development
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./services/steganography-engine:/app
      - /app/node_modules

  ip-capture:
    build:
      target: development
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./services/ip-capture:/app
      - /app/node_modules
```

---

## 9. Monitoring and Maintenance

### 9.1 Log Rotation

```ini
# /etc/logrotate.d/capnstegg

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/var/log/capnstegg/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

### 9.2 Monitoring Commands

```bash
#!/bin/bash
# Useful monitoring commands

# Check service status
docker-compose ps

# View logs
docker-compose logs -f --tail=100

# Check Nginx status
sudo systemctl status nginx

# Monitor connections
ss -tulpn | grep -E ':(80|443|3000|3001|3002)'

# Check disk usage
df -h

# Monitor Docker resources
docker stats
```

---

## 10. Security Checklist

### Server Hardening
- [ ] Disable root SSH login
- [ ] Configure SSH key authentication
- [ ] Set up UFW firewall
- [ ] Enable Fail2Ban
- [ ] Configure automatic security updates
- [ ] Disable unnecessary services

### Network Security
- [ ] Configure HTTPS with valid certificates
- [ ] Enable HSTS headers
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Restrict internal services to localhost

### Docker Security
- [ ] Use non-root users in containers
- [ ] Limit container resources
- [ ] Use secrets management
- [ ] Keep images updated
- [ ] Enable Docker content trust

### Application Security
- [ ] Implement input validation
- [ ] Enable request logging
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Implement authentication/authorization

---

## 11. Troubleshooting

### Common Issues

| Issue                          | Solution                                   |
|--------------------------------|-------------------------------------------|
| Nginx 502 Bad Gateway          | Check if upstream services are running     |
| SSL certificate errors         | Verify certbot renewal, check paths        |
| Connection refused             | Check firewall rules and service ports     |
| ProxyChains not working        | Verify proxy list and test connectivity    |
| Docker network issues          | Recreate network with docker-compose down  |

### Diagnostic Commands

```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test SSL configuration
openssl s_client -connect capnstegg.example.com:443

# Check Docker container logs
docker logs capnstegg-orchestration

# Test ProxyChains
proxychains4 curl -I https://check.torproject.org
```

---

*Document Version: 1.0.0*
*Last Updated: Phase 1 Initial Release*
