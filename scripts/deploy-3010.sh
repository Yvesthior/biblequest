#!/bin/bash

# ==============================================================================
# SCRIPT DE DÉPLOIEMENT BIBLE-QUIZ-APP (PORT 3010)
# ==============================================================================
# Usage: sudo ./scripts/deploy-3010.sh
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN_APP="biblequest.site"
EMAIL_CERTBOT="admin@biblequest.site"

echo -e "${BLUE}🚀 Démarrage du déploiement sur le port 3010...${NC}"

# 1. Installation des dépendances
echo -e "${BLUE}📦 Installation des dépendances...${NC}"
npm ci

# 2. Build de l'application
echo -e "${BLUE}🏗️ Build de l'application...${NC}"
npm run build

# 3. Synchronisation de la Base de Données
echo -e "${BLUE}🗄️ Synchronisation de la base de données (Sequelize)...${NC}"
# On s'assure que .env est bien là
if [ ! -f .env ]; then
    echo -e "${RED}❌ Fichier .env manquant ! Veuillez le créer avant de déployer.${NC}"
    echo "Exemple: database_url, nextauth_secret, etc."
    exit 1
fi
npx tsx scripts/sync-db.ts

# 4. PM2 (Start/Reload)
echo -e "${BLUE}🚀 Gestion du processus PM2 (Port 3010)...${NC}"
if pm2 list | grep -q "bible-quiz-app"; then
    pm2 reload bible-quiz-app
else
    pm2 start ecosystem.config.cjs
    pm2 save
    # On suppose que pm2 startup a déjà été fait sur le serveur, sinon décommenter :
    # pm2 startup
fi

# 5. Configuration Nginx
echo -e "${BLUE}🌐 Configuration Nginx...${NC}"
cp nginx/biblequest.site /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/biblequest.site /etc/nginx/sites-enabled/

# Vérification syntaxe et reload
nginx -t
systemctl reload nginx

# 6. SSL (Certbot)
echo -e "${BLUE}🔒 Configuration SSL...${NC}"
# On lance certbot uniquement si le certificat n'existe pas ou pour forcer le renouvellement
# --redirect force la redirection HTTP -> HTTPS
certbot --nginx -d $DOMAIN_APP -d www.$DOMAIN_APP --non-interactive --agree-tos -m $EMAIL_CERTBOT --redirect

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ !${NC}"
echo -e "📱 Application accessible sur: https://${DOMAIN_APP}"
echo -e "${GREEN}===========================================================${NC}"
