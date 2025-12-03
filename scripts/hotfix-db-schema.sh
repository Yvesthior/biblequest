#!/bin/bash

# ==============================================================================
# SCRIPT HOTFIX SCHEMA BDD (Text Limit Fix)
# ==============================================================================
# Usage: sudo ./scripts/hotfix-db-schema.sh
# ==============================================================================

set -e

echo -e "\033[0;34m🔧 Application du correctif de schéma BDD...\033[0m"

# 1. Mise à jour du code (si tu utilises git sur le serveur, sinon assure-toi que schema.prisma est à jour manuellement)
# git pull origin main 
# (Je laisse commenté car je ne sais pas si tu as configuré git pull auto, 
# mais assure-toi d'avoir le nouveau schema.prisma avant de lancer ce script)

# 2. Génération et Push
echo -e "\033[0;34m🛠️ Prisma Generate & DB Push...\033[0m"
npx prisma generate
npx prisma db push

# 3. Redémarrage PM2
echo -e "\033[0;34m🔄 Redémarrage de l'application...\033[0m"
pm2 restart "bible-quiz-app"

echo -e "\033[0;32m✅ Correctif appliqué. La colonne 'answers' supporte maintenant les longs textes.\033[0m"
