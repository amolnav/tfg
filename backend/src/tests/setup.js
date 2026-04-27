import { vi } from 'vitest';

// Desactivar logs de Winston durante los tests para tener una salida limpia
vi.mock('../utils/logger', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

const mockPrisma = {
  booking: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  shift: {
    findMany: vi.fn(),
  },
  customer: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  table: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  zone: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  systemConfig: {
    findUnique: vi.fn(),
  },
  closure: {
    findMany: vi.fn(),
  },
  $connect: vi.fn().mockResolvedValue(true),
  $disconnect: vi.fn().mockResolvedValue(true),
  $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  $executeRaw: vi.fn().mockResolvedValue(true),
};

mockPrisma.$transaction = vi.fn(async (callback) => callback(mockPrisma));

// Inyectar en global para que database.js lo use (Singleton pattern)
global.prisma = mockPrisma;

// Mock de Socket.io
vi.mock('../socketManager', () => ({
  initSocketServer: vi.fn(),
  getIO: vi.fn(() => ({
    emit: vi.fn()
  }))
}));
