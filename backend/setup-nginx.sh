#!/bin/bash

# Service-Finder Local Nginx Production Testing Setup

echo "🔐 Service-Finder Nginx Local Production Setup"
echo "================================================"

# Create SSL certificates directory
mkdir -p ./nginx/ssl

# Generate Self-Signed Certificate (valid for 365 days)
echo "📜 Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ./nginx/ssl/server.key \
    -out ./nginx/ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ SSL certificates generated"
echo ""

# Backup original nginx.conf if it exists
if [ -f /etc/nginx/nginx.conf ]; then
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    echo "📦 Original nginx.conf backed up"
fi

# Copy custom config
echo "📝 Setting up nginx configuration..."
sudo cp ./nginx.conf /etc/nginx/nginx.conf
sudo chmod 644 /etc/nginx/nginx.conf

# Fix permissions
sudo chown -R nobody:nobody ./nginx/ssl

echo ""
echo "🚀 To start nginx, run:"
echo "   sudo nginx"
echo ""
echo "📊 To reload config without downtime:"
echo "   sudo nginx -s reload"
echo ""
echo "🛑 To stop nginx:"
echo "   sudo nginx -s stop"
echo ""
echo "✅ Setup complete!"
