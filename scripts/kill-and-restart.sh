#!/bin/bash

# ==============================================================================
# SCRIPT DE NETTOYAGE PORT 3000 & REDÉMARRAGE PM2
# ==============================================================================
# Usage: sudo ./scripts/kill-and-restart.sh
# ==============================================================================

set -e

echo -e "\033[0;34m🛑 Arrêt de PM2...\033[0m"
pm2 stop all || true
pm2 delete all || true

echo -e "\033[0;34m🔪 Recherche et arrêt des processus fantômes sur le port 3000...\033[0m"

# Trouve les PIDs qui utilisent le port 3000
PIDS=$(lsof -t -i:3000)

if [ -n "$PIDS" ]; then
    echo "Processus trouvés : $PIDS"
    echo "Tuerie en cours..."
    kill -9 $PIDS
    echo -e "\033[0;32m✅ Processus tués.\033[0m"
else
    echo "Aucun processus trouvé sur le port 3000."
fi

echo -e "\033[0;34m🚀 Relance propre de l'application...\033[0m"
# On utilise 'npm start' directement via PM2
pm2 start npm --name "bible-quiz-app" -- start
pm2 save

echo -e "\033[0;32m✅ Application redémarrée.\033[0m"
pm2 list
