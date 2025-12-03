# Quiz Biblique - Application MVP

Application de quiz biblique construite avec Next.js 14, Prisma, SQLite et NextAuth.

## 🚀 Installation

1. **Cloner le projet et installer les dépendances**

\`\`\`bash
npm install
\`\`\`

2. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

\`\`\`env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"
GITHUB_CLIENT_ID="votre-github-client-id"
GITHUB_CLIENT_SECRET="votre-github-client-secret"
\`\`\`

Pour générer `NEXTAUTH_SECRET` :
\`\`\`bash
openssl rand -base64 32
\`\`\`

Pour obtenir les credentials GitHub OAuth :
- Allez sur https://github.com/settings/developers
- Créez une nouvelle OAuth App
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

3. **Initialiser la base de données**

\`\`\`bash
npx prisma migrate dev --name init
npx prisma db seed
\`\`\`

4. **Lancer l'application**

\`\`\`bash
npm run dev
\`\`\`

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Fonctionnalités

- ✅ Authentification avec GitHub (NextAuth.js)
- ✅ Liste des quiz disponibles
- ✅ Interface de quiz interactive (une question à la fois)
- ✅ Sauvegarde des tentatives en base de données
- ✅ Page de résultats détaillée avec explications
- ✅ Design élégant et spirituel avec Tailwind CSS
- ✅ Responsive et accessible

## 🗄️ Structure de la base de données

- **User** : Utilisateurs authentifiés
- **Quiz** : Quiz disponibles
- **Question** : Questions avec options et réponses
- **QuizAttempt** : Historique des tentatives des utilisateurs

## 🛠️ Technologies

- **Next.js 14+** (App Router)
- **Prisma** (ORM)
- **SQLite** (Base de données)
- **NextAuth.js v4** (Authentification)
- **Tailwind CSS** (Styling)
- **shadcn/ui** (Composants UI)
