#!/bin/bash

# ==============================================================================
# SCRIPT DE DÉPLOIEMENT BIBLE-QUIZ-APP SUR VPS UBUNTU (DIGITAL OCEAN)
# ==============================================================================
# Usage: sudo ./scripts/deploy-vps.sh
# Pré-requis: Le projet doit être cloné dans /var/www/bible-quiz-app (ou dossier courant)
# ==============================================================================

set -e # Arrêter le script en cas d'erreur

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Domaines
DOMAIN_APP="biblequest.site"
DOMAIN_DB="dbmanager.biblequest.site"
EMAIL_CERTBOT="admin@biblequest.site" # Changez ceci si nécessaire ou demandez-le

echo -e "${BLUE}🚀 Démarrage du script de déploiement...${NC}"

# 1. Vérification Root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Ce script doit être lancé en tant que root (sudo).${NC}" 
   exit 1
fi

# Répertoire courant du projet
PROJECT_DIR=$(pwd)
echo -e "${BLUE}📂 Répertoire du projet détecté : ${PROJECT_DIR}${NC}"

# 2. Mise à jour du système
echo -e "${BLUE}🔄 Mise à jour du système...${NC}"
apt update && apt upgrade -y
apt install -y curl git unzip ufw build-essential

# 3. Installation de Node.js 20 (LTS)
echo -e "${BLUE}📦 Installation de Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Installation de MySQL
echo -e "${BLUE}📦 Installation de MySQL Server...${NC}"
apt install -y mysql-server

# 5. Configuration de la Base de Données
echo -e "${BLUE}🔐 Configuration de MySQL...${NC}"

# Génération de mots de passe aléatoires
DB_ROOT_PASS=$(openssl rand -base64 16)
DB_USER_PASS=$(openssl rand -base64 16)
DB_NAME="biblequizzapp"
DB_USER="biblequizz_user"

# Configuration silencieuse de MySQL (équivalent mysql_secure_installation)
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_ROOT_PASS}';"
mysql -u root -p"${DB_ROOT_PASS}" -e "DELETE FROM mysql.user WHERE User='';"
mysql -u root -p"${DB_ROOT_PASS}" -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -u root -p"${DB_ROOT_PASS}" -e "DROP DATABASE IF EXISTS test;"
mysql -u root -p"${DB_ROOT_PASS}" -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"

# Création de la base et de l'utilisateur
echo -e "${BLUE}🗄️ Création de la base de données '${DB_NAME}'...${NC}"
mysql -u root -p"${DB_ROOT_PASS}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -u root -p"${DB_ROOT_PASS}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_USER_PASS}';"
mysql -u root -p"${DB_ROOT_PASS}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -u root -p"${DB_ROOT_PASS}" -e "FLUSH PRIVILEGES;"

# Sauvegarde des identifiants
CREDENTIALS_FILE="/root/db_credentials.txt"
cat > "$CREDENTIALS_FILE" <<EOF
=============================================
IDENTIFIANTS BASE DE DONNÉES - BIBLE QUEST
=============================================
Date: $(date)

[MySQL Root]
User: root
Pass: ${DB_ROOT_PASS}

[Application User]
User: ${DB_USER}
Pass: ${DB_USER_PASS}
Database: ${DB_NAME}

[PhpMyAdmin]
URL: https://${DOMAIN_DB}
Login avec Root ou App User.
=============================================
EOF
chmod 600 "$CREDENTIALS_FILE"
echo -e "${GREEN}✅ Base de données configurée. Identifiants sauvegardés dans ${CREDENTIALS_FILE}${NC}"

# 6. Installation de Nginx et PHP (pour PhpMyAdmin)
echo -e "${BLUE}📦 Installation de Nginx et PHP...${NC}"
apt install -y nginx php-fpm php-mysql php-mbstring php-zip php-gd php-json php-curl

# 7. Installation de PhpMyAdmin (Manuelle pour éviter les prompts interactifs)
echo -e "${BLUE}📦 Installation de PhpMyAdmin...${NC}"
PMA_DIR="/var/www/phpmyadmin"
if [ ! -d "$PMA_DIR" ]; then
    mkdir -p /var/www/phpmyadmin
    cd /tmp
    wget https://www.phpmyadmin.net/downloads/phpMyAdmin-latest-all-languages.zip
    unzip phpMyAdmin-latest-all-languages.zip
    mv phpMyAdmin-*-all-languages/* $PMA_DIR
    rm -rf phpMyAdmin-*-all-languages*
    
    # Configuration blowfish secret
    RANDOM_BLOWFISH=$(openssl rand -base64 32)
    cp $PMA_DIR/config.sample.inc.php $PMA_DIR/config.inc.php
    sed -i "s/\\$cfg['blowfish_secret'] = '';/\$cfg['blowfish_secret'] = '$RANDOM_BLOWFISH';/" $PMA_DIR/config.inc.php
    chown -R www-data:www-data $PMA_DIR
    chmod -R 755 $PMA_DIR
fi

# 8. Configuration de l'application Next.js
echo -e "${BLUE}🏗️ Configuration de l'application Next.js...${NC}"
cd "$PROJECT_DIR"

# Installation des dépendances
echo "Installation des paquets npm..."
npm ci

# Génération du fichier .env interactif
echo -e "${YELLOW}📝 Configuration des variables d'environnement (.env)${NC}"

# Génération automatique de secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL="mysql://${DB_USER}:${DB_USER_PASS}@localhost:3306/${DB_NAME}"

echo "La DATABASE_URL a été générée automatiquement."
echo "Le NEXTAUTH_SECRET a été généré automatiquement."

# Demande des infos Google si besoin (optionnel, on met des placeholders sinon)
read -p "Entrez votre GOOGLE_CLIENT_ID (laisser vide pour placeholder): " GOOGLE_ID
read -p "Entrez votre GOOGLE_CLIENT_SECRET (laisser vide pour placeholder): " GOOGLE_SECRET

if [ -z "$GOOGLE_ID" ]; then GOOGLE_ID="change_me"; fi
if [ -z "$GOOGLE_SECRET" ]; then GOOGLE_SECRET="change_me"; fi

cat > .env <<EOF
DATABASE_URL="${DATABASE_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://${DOMAIN_APP}"
GOOGLE_CLIENT_ID="${GOOGLE_ID}"
GOOGLE_CLIENT_SECRET="${GOOGLE_SECRET}"
# Analytics
NEXT_PUBLIC_GA_ID="G-EBK0XRYDFQ"
EOF

echo -e "${GREEN}✅ Fichier .env créé.${NC}"

# Prisma et Build
echo -e "${BLUE}🛠️ Exécution de Prisma et Build...${NC}"
npx prisma generate
# On utilise db push pour la première mise en prod pour éviter les conflits d'historique de migration
npx prisma db push
npm run build

# 9. Configuration PM2
echo -e "${BLUE}🚀 Lancement avec PM2...${NC}"
npm install -g pm2
pm2 start npm --name "bible-quiz-app" -- start
pm2 save
# Configuration du démarrage automatique au boot
# Note: La commande 'pm2 startup' génère une commande à exécuter. 
# On l'exécute automatiquement pour systemd.
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# 10. Configuration Nginx
echo -e "${BLUE}🌐 Configuration de Nginx...${NC}"

# Config App Next.js
cat > /etc/nginx/sites-available/${DOMAIN_APP} <<EOF
server {
    listen 80;
    server_name ${DOMAIN_APP} www.${DOMAIN_APP};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Config PhpMyAdmin
# Détection version PHP pour le socket FPM
PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
cat > /etc/nginx/sites-available/${DOMAIN_DB} <<EOF
server {
    listen 80;
    server_name ${DOMAIN_DB};
    root /var/www/phpmyadmin;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

# Activation des sites
ln -sf /etc/nginx/sites-available/${DOMAIN_APP} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${DOMAIN_DB} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test et reload Nginx
nginx -t
systemctl reload nginx

# 11. SSL avec Certbot
echo -e "${BLUE}🔒 Installation des certificats SSL (Let's Encrypt)...${NC}"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ${DOMAIN_APP} -d ${DOMAIN_DB} --non-interactive --agree-tos -m ${EMAIL_CERTBOT} --redirect

# 12. Firewall (UFW)
echo -e "${BLUE}🛡️ Configuration du Firewall (UFW)...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo -e "📱 Application : https://${DOMAIN_APP}"
echo -e "🗄️  PhpMyAdmin  : https://${DOMAIN_DB}"
echo -e "🔑 Identifiants DB : /root/db_credentials.txt"
echo -e "==========================================================="
echo -e "${YELLOW}⚠️  N'oublie pas de vérifier ton fichier .env si tu n'as pas mis les clés Google !${NC}"
