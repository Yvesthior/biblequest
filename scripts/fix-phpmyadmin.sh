#!/bin/bash

# ==============================================================================
# SCRIPT DE RÉPARATION PHPMYADMIN (ERREUR 502)
# ==============================================================================
# Usage: sudo ./scripts/fix-phpmyadmin.sh
# ==============================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN_DB="dbmanager.biblequest.site"

echo -e "${BLUE}🔧 Diagnostic et réparation de PhpMyAdmin...${NC}"

# 1. Détection de la version PHP installée
PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
echo -e "${BLUE}ℹ️  Version PHP détectée : ${PHP_VERSION}${NC}"

# 2. Vérification du socket FPM
SOCKET_PATH="/var/run/php/php${PHP_VERSION}-fpm.sock"

if [ ! -S "$SOCKET_PATH" ]; then
    echo -e "${RED}❌ Le socket PHP-FPM n'existe pas à : ${SOCKET_PATH}${NC}"
    echo "Recherche d'autres sockets..."
    FOUND_SOCKET=$(find /var/run/php/ -name "*.sock" | head -n 1)
    
    if [ -n "$FOUND_SOCKET" ]; then
        echo -e "${GREEN}✅ Socket alternatif trouvé : ${FOUND_SOCKET}${NC}"
        SOCKET_PATH=$FOUND_SOCKET
    else
        echo -e "${RED}❌ Aucun socket PHP-FPM trouvé. Réinstallation de PHP-FPM...${NC}"
        apt update
        apt install -y php-fpm php-mysql
        systemctl enable php${PHP_VERSION}-fpm
        systemctl start php${PHP_VERSION}-fpm
        # On re-vérifie
        SOCKET_PATH="/var/run/php/php${PHP_VERSION}-fpm.sock"
    fi
else
    echo -e "${GREEN}✅ Socket PHP-FPM trouvé : ${SOCKET_PATH}${NC}"
fi

# 3. Correction de la config Nginx
echo -e "${BLUE}📝 Mise à jour de la configuration Nginx...${NC}"

CONFIG_FILE="/etc/nginx/sites-available/${DOMAIN_DB}"

# On réécrit le fichier de config avec le bon chemin de socket
cat > "$CONFIG_FILE" <<EOF
server {
    listen 80;
    server_name ${DOMAIN_DB};
    root /var/www/phpmyadmin;
    index index.php index.html index.htm;

    # Logs pour le debug
    error_log /var/log/nginx/phpmyadmin_error.log;
    access_log /var/log/nginx/phpmyadmin_access.log;

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${SOCKET_PATH};
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

# On rajoute le bloc SSL s'il a été supprimé par l'écrasement (Certbot gère ça, mais pour être propre on laisse certbot le remettre ou on le force)
# Le plus simple est de redemander à certbot de réinstaller la config SSL sur ce fichier existant.
# Mais d'abord on vérifie la syntaxe.

# 4. Permissions dossier
echo -e "${BLUE}🔒 Vérification des permissions...${NC}"
chown -R www-data:www-data /var/www/phpmyadmin
chmod -R 755 /var/www/phpmyadmin

# 5. Redémarrage Services
echo -e "${BLUE}🔄 Redémarrage des services...${NC}"

# Redémarrage PHP-FPM (le nom du service dépend de la version)
SERVICE_NAME="php${PHP_VERSION}-fpm"
systemctl restart "$SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Service ${SERVICE_NAME} actif.${NC}"
else
    echo -e "${RED}❌ Erreur : Le service ${SERVICE_NAME} ne démarre pas.${NC}"
    systemctl status "$SERVICE_NAME" --no-pager
    exit 1
fi

# Test et reload Nginx
nginx -t
systemctl reload nginx

# 6. Réapplication SSL (pour s'assurer que le bloc 443 est bien là)
echo -e "${BLUE}🔒 Réapplication de la config SSL...${NC}"
certbot --nginx -d ${DOMAIN_DB} --non-interactive --reinstall --redirect

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}✅ RÉPARATION TERMINÉE !${NC}"
echo -e "Essayez d'accéder à : https://${DOMAIN_DB}"
echo -e "==========================================================="
