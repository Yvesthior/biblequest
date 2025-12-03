#!/bin/bash

# ==============================================================================
# SCRIPT FIX AUTH UNTRUSTED HOST
# ==============================================================================
# Usage: sudo ./scripts/fix-auth-host.sh
# ==============================================================================

set -e

echo -e "\033[0;34m🔧 Correction de l'erreur UntrustedHost pour NextAuth...\033[0m"

# 1. Modification du fichier .env
if ! grep -q "AUTH_TRUST_HOST=" .env; then
    echo "AUTH_TRUST_HOST=true" >> .env
    echo -e "\033[0;32m✅ Variable AUTH_TRUST_HOST=true ajoutée au .env\033[0m"
else
    echo "La variable AUTH_TRUST_HOST existe déjà."
fi

# 2. Rechargement de l'application
echo -e "\033[0;34m🔄 Redémarrage de l'application avec PM2...\033[0m"

# On s'assure que PM2 prend en compte les nouvelles variables d'environnement
# La méthode la plus sûre est de supprimer et recréer le process
pm2 delete "bible-quiz-app" || true
pm2 start npm --name "bible-quiz-app" -- start
pm2 save

echo -e "\033[0;32m✅ Application redémarrée. L'erreur UntrustedHost devrait être résolue.\033[0m"
