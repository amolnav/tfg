
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const prisma = require('./config/database');
const { initSocketServer } = require('./socketManager');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/authMiddleware');

// --- IMPORTACIÓN DE RUTAS ---
// Auth
const authRoutes = require('./routes/auth');

// Rutas públicas (Frontend cliente)
const publicReservationRoutes = require('./routes/public/reservations');
const publicMenuRoutes = require('./routes/public/menu');
const publicReviewsRoutes = require('./routes/public/reviews');
const publicConfigRoutes = require('./routes/public/config');

// Rutas back-office (Panel de gestión)
const backofficeBookingRoutes = require('./routes/backoffice/bookings');
const backofficeZoneRoutes = require('./routes/backoffice/zones');
const backofficeCustomerRoutes = require('./routes/backoffice/customers');
const backofficeShiftRoutes = require('./routes/backoffice/shifts');
const backofficeClosureRoutes = require('./routes/backoffice/closures');
const backofficeDashboardRoutes = require('./routes/backoffice/dashboard');
const backofficeConfigRoutes = require('./routes/backoffice/config');
const backofficeMenuRoutes = require('./routes/backoffice/menu');

// --- CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- MIDDLEWARES GLOBALES ---
app.use(helmet()); // Seguridad HTTP
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined')); // Logs
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parser URL-encoded

// --- LOGGING DE REQUESTS (Desarrollo) ---
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  });
}

// --- DEFINICIÓN DE RUTAS ---

// 1. Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Motor de Reservas API',
    version: '2.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 2. Health Check avanzado (con DB)
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// 3. Auth
app.use('/api/auth', authRoutes);

// 4. APIs PÚBLICAS (Frontend Cliente)
app.use('/api/public/reservations', publicReservationRoutes);
app.use('/api/public/menu', publicMenuRoutes);
app.use('/api/public/reviews', publicReviewsRoutes);
app.use('/api/public/config', publicConfigRoutes);

// 5. APIs BACK-OFFICE (Panel de Gestión) — protegidas con JWT
app.use('/api/backoffice', authMiddleware);
app.use('/api/backoffice/bookings', backofficeBookingRoutes);
app.use('/api/backoffice/zones', backofficeZoneRoutes);
app.use('/api/backoffice/customers', backofficeCustomerRoutes);
app.use('/api/backoffice/shifts', backofficeShiftRoutes);
app.use('/api/backoffice/closures', backofficeClosureRoutes);
app.use('/api/backoffice/dashboard', backofficeDashboardRoutes);
app.use('/api/backoffice/config', backofficeConfigRoutes);
app.use('/api/backoffice/menu', backofficeMenuRoutes);

// 5. Ruta de Debug - Ver zonas y mesas (Solo desarrollo)
if (NODE_ENV === 'development') {
  app.get('/api/debug/zones', async (req, res) => {
    try {
      const zones = await prisma.zone.findMany({
        include: { 
          tables: true,
          _count: { select: { tables: true } }
        }
      });
      res.json({
        status: 'success',
        data: zones
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo zonas' });
    }
  });

  app.get('/api/debug/customers', async (req, res) => {
    try {
      const customers = await prisma.customer.findMany({
        include: {
          _count: { select: { bookings: true } }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      res.json({
        status: 'success',
        data: customers
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo clientes' });
    }
  });
}

// --- MANEJO DE ERRORES ---
// Rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// --- ARRANQUE DEL SERVIDOR ---
async function startServer() {
  try {
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Base de Datos PostgreSQL: CONECTADA');
    
    // Verificar que hay datos iniciales
    const zoneCount = await prisma.zone.count();
    const tableCount = await prisma.table.count();
    
    if (zoneCount === 0 || tableCount === 0) {
      console.log('⚠️  ADVERTENCIA: No hay zonas o mesas en la base de datos.');
      console.log('   Ejecuta: npm run db:seed');
    } else {
      console.log(`📊 Datos: ${zoneCount} zonas, ${tableCount} mesas`);
    }

    // Iniciar servidor Socket.io + HTTP
    initSocketServer(server);
    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('🚀 MOTOR DE RESERVAS API v2.0');
      console.log('═══════════════════════════════════════════');
      console.log(`📍 Servidor: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
      console.log('');
      console.log('📡 Endpoints disponibles:');
      console.log('   🌐 Frontend Público:');
      console.log('      POST /api/public/reservations/availability/check');
      console.log('      GET  /api/public/reservations/availability/calendar');
      console.log('      POST /api/public/reservations/availability/times');
      console.log('      POST /api/public/reservations');
      console.log('');
      console.log('   🏢 Back-office:');
      console.log('      GET  /api/backoffice/bookings');
      console.log('      GET  /api/backoffice/dashboard');
      console.log('      GET  /api/backoffice/customers');
      console.log('      ... y más');
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n⚠️  Cerrando servidor (${signal})...`);
  await prisma.$disconnect();
  console.log('✅ Conexión a BD cerrada');
  process.exit(0);
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});

// Iniciar solo si se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = app;
