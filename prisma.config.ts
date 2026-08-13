import { defineConfig } from 'prisma/config'

// Charger les env vars
if (!process.env.DATABASE_URL) {
  const { config } = await import('dotenv')
  config({ path: '.env' })
  config({ path: '.env.local', override: true })
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Pour db push / migrate → session pooler (port 5432), pas transaction pooler
    // Le transaction pooler (6543) ne supporte pas les prepared statements
    url: process.env.DIRECT_URL!,
  },
})
