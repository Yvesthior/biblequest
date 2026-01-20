/**
 * Configuration Prisma pour Prisma ORM v7+
 * La configuration du datasource URL a été déplacée ici depuis schema.prisma
 * 
 * Documentation: https://pris.ly/d/config-datasource
 */

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
