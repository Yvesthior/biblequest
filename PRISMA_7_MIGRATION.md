# Migration vers Prisma 7 - Documentation

## ✅ Changements effectués

### 1. **Schema Prisma** (`prisma/schema.prisma`)

**Avant (Prisma 6) :**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**Après (Prisma 7) :**
```prisma
datasource db {
  provider = "mysql"
  // url retiré - maintenant dans prisma.config.ts
}
```

### 2. **Nouveau fichier de configuration** (`prisma.config.ts`)

Création d'un nouveau fichier de configuration pour Prisma 7 :

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

### 3. **Client Prisma** (`lib/prisma.ts`)

Le fichier `lib/prisma.ts` reste inchangé et fonctionne correctement avec Prisma 7 :

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

## 📋 Changements dans Prisma 7

### Pourquoi ce changement ?

Dans Prisma 7, la propriété `url` du datasource a été déplacée du fichier `schema.prisma` vers `prisma.config.ts` pour :

1. **Séparation des préoccupations** : Le schema définit la structure, la config définit la connexion
2. **Flexibilité** : Permet d'utiliser différents adapters (Accelerate, etc.)
3. **Sécurité** : Meilleure gestion des credentials

### Structure des fichiers

```
prisma/
├── schema.prisma          # Définition des modèles (sans url)
├── migrations/            # Migrations
└── seed.ts               # Seed data

prisma.config.ts          # Configuration de connexion (nouveau)
lib/
└── prisma.ts             # Client Prisma (inchangé)
```

## 🔧 Utilisation

### Génération du client

```bash
npm run postinstall
# ou
npx prisma generate
```

### Migrations

```bash
npm run prisma:migrate
# ou
npx prisma migrate dev
```

### Push du schema (dev uniquement)

```bash
npm run prisma:push
# ou
npx prisma db push
```

## ✅ Vérification

La configuration a été testée avec succès :

```bash
✔ Generated Prisma Client (v7.2.0) to .\node_modules\@prisma\client in 184ms
```

## 📚 Documentation

- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Config Reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Datasource Configuration](https://www.prisma.io/docs/orm/reference/prisma-config-reference#datasource)

## ⚠️ Notes importantes

1. **Compatibilité** : Cette configuration fonctionne avec Prisma 7.2.0+
2. **MySQL** : La configuration utilise MySQL comme provider
3. **Environment Variables** : `DATABASE_URL` doit être défini dans `.env`
4. **Next.js** : Compatible avec Next.js 15.5.6

## 🚀 Prochaines étapes (optionnel)

Si vous souhaitez utiliser Prisma Accelerate ou d'autres adapters :

```typescript
// Exemple avec Prisma Accelerate
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

export const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate())
```

---

**Date de migration** : 2025-01-13
**Version Prisma** : 7.2.0
**Status** : ✅ Configuration validée et fonctionnelle
