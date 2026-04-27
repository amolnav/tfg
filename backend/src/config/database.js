
const { PrismaClient } = require('@prisma/client');

// Instancia única de Prisma (Singleton Pattern)
// Evita múltiples conexiones a la BD
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
