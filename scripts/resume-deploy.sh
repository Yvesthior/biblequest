#!/bin/bash

# ==============================================================================
# SCRIPT DE REPRISE DE DÉPLOIEMENT (FIX DB URL & FINISH)
# ==============================================================================
# Usage: sudo ./scripts/resume-deploy.sh
# ==============================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN_APP="biblequest.site"
DOMAIN_DB="dbmanager.biblequest.site"
EMAIL_CERTBOT="admin@biblequest.site"
DB_NAME="biblequizzapp"
DB_USER="biblequizz_user"

# Répertoire du projet (suppose qu'on est dedans)
PROJECT_DIR=$(pwd)

echo -e "${BLUE}🚀 Reprise du déploiement (Fix Database URL)...${NC}"

# 1. Récupération/Génération d'un mot de passe SAFE (Alphanumérique uniquement)
# On évite base64 qui met des +, / et = qui cassent l'URL Prisma
echo -e "${BLUE}🔐 Génération d'un nouveau mot de passe DB sécurisé (sans caractères spéciaux)...${NC}"
NEW_DB_PASS=$(openssl rand -hex 16)

# 2. Mise à jour du mot de passe dans MySQL
echo -e "${BLUE}🔄 Mise à jour de l'utilisateur MySQL '${DB_USER}'...${NC}"
mysql -u root -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${NEW_DB_PASS}';"
mysql -u root -e "FLUSH PRIVILEGES;"

# 3. Reconstruction de l'URL de connexion
DATABASE_URL="mysql://${DB_USER}:${NEW_DB_PASS}@localhost:3306/${DB_NAME}"

# 4. Mise à jour du fichier .env
echo -e "${BLUE}📝 Correction du fichier .env...${NC}"
# On utilise sed pour remplacer la ligne DATABASE_URL existante
if grep -q "DATABASE_URL=" .env; then
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
else
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
fi

echo -e "${GREEN}✅ URL de base de données corrigée dans .env${NC}"

# 5. Mise à jour du fichier de credentials pour l'admin
CREDENTIALS_FILE="/root/db_credentials_updated.txt"
cat > "${CREDENTIALS_FILE}" <<EOF
=============================================
NOUVEAUX IDENTIFIANTS DB (CORRIGÉS)
=============================================
Date: $(date)

[Application User]
User: ${DB_USER}
Pass: ${NEW_DB_PASS}
Database: ${DB_NAME}

L'ancien mot de passe root n'a pas changé.
=============================================
EOF
chmod 600 "${CREDENTIALS_FILE}"

# 6. Reprise des opérations Prisma
echo -e "${BLUE}🛠️ Relance de Prisma (Generate & Push)...${NC}"
npx prisma generate
npx prisma db push

# 7. Build Next.js
echo -e "${BLUE}🏗️ Relance du Build...${NC}"
npm run build

# 8. PM2 (Redémarrage ou Démarrage)
echo -e "${BLUE}🚀 Gestion du processus PM2...${NC}"
npm install -g pm2
pm2 delete "bible-quiz-app" || true # Supprime l'ancien si existant pour être propre
pm2 start npm --name "bible-quiz-app" -- start
pm2 save
# On force la mise à jour du script de startup
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true

# 9. Configuration Nginx (Si pas déjà fait ou pour être sûr)
echo -e "${BLUE}🌐 Vérification Nginx...${NC}"

# Config App
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
PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION."=".PHP_MINOR_VERSION;')
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

ln -sf /etc/nginx/sites-available/${DOMAIN_APP} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${DOMAIN_DB} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

# 10. SSL (Seulement si pas déjà fait)
echo -e "${BLUE}🔒 Vérification SSL...${NC}"
if [ ! -d "/etc/letsencrypt/live/${DOMAIN_APP}" ]; then
    echo "Installation certificats..."
    certbot --nginx -d ${DOMAIN_APP} -d ${DOMAIN_DB} --non-interactive --agree-tos -m ${EMAIL_CERTBOT} --redirect
else
    echo "Certificats déjà présents, on continue."
fi

# 11. Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT REPRIS ET TERMINÉ !${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo -e "📱 Application : https://${DOMAIN_APP}"
echo -e "🗄️  PhpMyAdmin  : https://${DOMAIN_DB}"
echo -e "🔑 Nouveaux ids : /root/db_credentials_updated.txt"
