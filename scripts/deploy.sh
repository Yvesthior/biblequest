#!/bin/bash

# =============================================================================
# Bible Quiz App - Automated Deployment Script
# Domain: biblequest.site
# phpMyAdmin: dbman.biblequest.site
# =============================================================================
# Prerequisites:
#   - Ubuntu 22.04+ or Debian 11+
#   - Root or sudo access
#   - DNS A records pointing to this server for both domains
# =============================================================================

set -e  # Exit on any error

# --- Configuration ---
APP_DOMAIN="biblequest.site"
PHPMYADMIN_DOMAIN="dbman.biblequest.site"
APP_DIR="/var/www/biblequest"
DB_NAME="biblequizzapp"
DB_USER="biblequest_user"
DB_PASSWORD=$(openssl rand -base64 16)  # Auto-generated password
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NODE_VERSION="20"

echo "=============================================="
echo "  Bible Quiz App - Deployment Script"
echo "=============================================="
echo ""
echo "This script will:"
echo "  1. Install Node.js, MySQL, Nginx, PM2"
echo "  2. Configure MySQL database"
echo "  3. Install and configure phpMyAdmin"
echo "  4. Deploy the Next.js application"
echo "  5. Configure Nginx with SSL (Let's Encrypt)"
echo ""
echo "Domains:"
echo "  - App: https://${APP_DOMAIN}"
echo "  - phpMyAdmin: https://${PHPMYADMIN_DOMAIN}"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

# --- Step 1: System Update ---
echo ""
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# --- Step 2: Install Dependencies ---
echo ""
echo "[2/8] Installing dependencies..."
apt install -y curl git nginx certbot python3-certbot-nginx mysql-server unzip

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# --- Step 3: Configure MySQL ---
echo ""
echo "[3/8] Configuring MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "Database created: ${DB_NAME}"
echo "Database user: ${DB_USER}"

# --- Step 4: Install phpMyAdmin ---
echo ""
echo "[4/8] Installing phpMyAdmin..."
cd /tmp
wget https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip
unzip -o phpMyAdmin-5.2.1-all-languages.zip
rm -rf /usr/share/phpmyadmin
mv phpMyAdmin-5.2.1-all-languages /usr/share/phpmyadmin
mkdir -p /usr/share/phpmyadmin/tmp
chmod 777 /usr/share/phpmyadmin/tmp

# Generate blowfish secret for phpMyAdmin
BLOWFISH_SECRET=$(openssl rand -base64 32)
cat > /usr/share/phpmyadmin/config.inc.php <<EOF
<?php
\$cfg['blowfish_secret'] = '${BLOWFISH_SECRET}';
\$cfg['TempDir'] = '/usr/share/phpmyadmin/tmp';
\$i = 0;
\$i++;
\$cfg['Servers'][\$i]['auth_type'] = 'cookie';
\$cfg['Servers'][\$i]['host'] = 'localhost';
\$cfg['Servers'][\$i]['compress'] = false;
\$cfg['Servers'][\$i]['AllowNoPassword'] = false;
EOF

# Install PHP for phpMyAdmin
apt install -y php-fpm php-mysql php-mbstring php-zip php-gd php-json php-curl

# --- Step 5: Deploy Application ---
echo ""
echo "[5/8] Deploying application..."

# Create app directory if not exists
mkdir -p ${APP_DIR}

# Copy application files (assuming we're in the cloned repo)
cp -r ./* ${APP_DIR}/
cd ${APP_DIR}

# Create .env file
cat > ${APP_DIR}/.env <<EOF
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_NAME}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://${APP_DOMAIN}"
NODE_ENV="production"
EOF

# Install dependencies and build
npm ci
npx prisma generate
npx prisma db push
npm run build

# --- Step 6: Configure PM2 ---
echo ""
echo "[6/8] Configuring PM2..."

cat > ${APP_DIR}/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'biblequest',
    script: 'npm',
    args: 'start',
    cwd: '${APP_DIR}',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

pm2 start ${APP_DIR}/ecosystem.config.js
pm2 save
pm2 startup

# --- Step 7: Configure Nginx ---
echo ""
echo "[7/8] Configuring Nginx..."

# Get PHP-FPM socket path
PHP_FPM_SOCK=$(find /var/run/php -name "*.sock" | head -1)

# Main app configuration
cat > /etc/nginx/sites-available/${APP_DOMAIN} <<EOF
server {
    listen 80;
    server_name ${APP_DOMAIN} www.${APP_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# phpMyAdmin configuration
cat > /etc/nginx/sites-available/${PHPMYADMIN_DOMAIN} <<EOF
server {
    listen 80;
    server_name ${PHPMYADMIN_DOMAIN};

    root /usr/share/phpmyadmin;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${PHP_FPM_SOCK};
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/${APP_DOMAIN} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${PHPMYADMIN_DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# --- Step 8: SSL Certificates ---
echo ""
echo "[8/8] Setting up SSL certificates..."
certbot --nginx -d ${APP_DOMAIN} -d www.${APP_DOMAIN} --non-interactive --agree-tos -m admin@${APP_DOMAIN}
certbot --nginx -d ${PHPMYADMIN_DOMAIN} --non-interactive --agree-tos -m admin@${APP_DOMAIN}

# Setup auto-renewal
echo "0 3 * * * certbot renew --quiet" | crontab -

# --- Done ---
echo ""
echo "=============================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Application URL: https://${APP_DOMAIN}"
echo "phpMyAdmin URL:  https://${PHPMYADMIN_DOMAIN}"
echo ""
echo "Database credentials (SAVE THESE!):"
echo "  Database: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "App credentials stored in: ${APP_DIR}/.env"
echo ""
echo "PM2 commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs biblequest - View logs"
echo "  pm2 restart all     - Restart app"
echo ""
echo "=============================================="
