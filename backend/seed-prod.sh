#!/bin/bash
export DATABASE_URL="postgresql://meson_marinero_user:AEcWu57notgL0w6j710l2squtmTz8Ay3@dpg-d7r56ovavr4c73fbl9tg-a.frankfurt-postgres.render.com/meson_marinero?sslmode=require"
echo "📦 Forzando sincronización de base de datos..."
npx prisma db push --accept-data-loss
echo "🌱 Conectando a la base de datos de producción en Render para inyectar datos..."
npx tsx prisma/seed.ts
echo "✅ Proceso finalizado."
