#!/bin/bash

# ==============================================================================
# SCRIPT FINAL : SSL & FIREWALL
# ==============================================================================
# Usage: sudo ./scripts/finish-deploy-ssl.sh
# ==============================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN_APP="biblequest.site"
DOMAIN_DB="dbmanager.biblequest.site"
EMAIL_CERTBOT="admin@biblequest.site"

echo -e "${BLUE}🚀 Finalisation du déploiement (SSL & Sécurité)...${NC}"

# 1. Installation de Certbot (via snap pour avoir la dernière version, méthode recommandée)
echo -e "${BLUE}📦 Installation de Certbot...${NC}"

# Vérification si snapd est installé (standard sur Ubuntu)
if ! command -v snap &> /dev/null; then
    apt update
    apt install -y snapd
fi

# Installation du core snap
snap install core
snap refresh core

# Installation de certbot
# On supprime l'ancien si existant via apt pour éviter les conflits
apt remove -y certbot || true
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo -e "${GREEN}✅ Certbot installé.${NC}"

# 2. Génération des certificats SSL
echo -e "${BLUE}🔒 Génération des certificats SSL (Let's Encrypt)...${NC}"

# On arrête Nginx temporairement pour éviter les conflits de port si on utilisait --standalone, 
# mais ici on utilise --nginx donc Nginx DOIT tourner.
# On recharge nginx juste pour être sûr qu'il a pris la config HTTP avant
systemctl reload nginx

certbot --nginx -d ${DOMAIN_APP} -d ${DOMAIN_DB} --non-interactive --agree-tos -m ${EMAIL_CERTBOT} --redirect

echo -e "${GREEN}✅ Certificats SSL installés et HTTPS activé.${NC}"

# 3. Configuration du Firewall (UFW)
echo -e "${BLUE}🛡️ Activation du Firewall (UFW)...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
# On refuse le reste par défaut
ufw default deny incoming
ufw default allow outgoing
# Activation sans prompt
echo "y" | ufw enable

echo -e "${GREEN}✅ Firewall configuré.${NC}"

# 4. Récapitulatif final
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}🎉 DÉPLOIEMENT 100% TERMINÉ !${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo -e "📱 Application : https://${DOMAIN_APP}"
echo -e "🗄️  PhpMyAdmin  : https://${DOMAIN_DB}"
echo -e "🔑 Identifiants : Voir /root/db_credentials_updated.txt"
echo -e "==========================================================="
