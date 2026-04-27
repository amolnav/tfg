const prisma = require('../config/database');
const { DEFAULT_PUBLIC_CONFIG, DEFAULT_SPECIALTIES } = require('../config/publicConfig');

/**
 * Obtiene la configuración combinando la base de datos con métricas calculadas
 */
async function getFullConfig() {
  const configs = await prisma.systemConfig.findMany();
  
  const configMap = {};
  configs.forEach(c => configMap[c.key] = c.value);
  
  // Calcular métricas dinámicas basadas en las mesas
  const activeTables = await prisma.table.findMany({
    where: { isActive: true }
  });

  const totalCapacity = activeTables.reduce((sum, table) => sum + table.maxCapacity, 0);
  const maxPaxInSingleTable = activeTables.reduce((max, table) => Math.max(max, table.maxCapacity), 0);
  const activeTablesCount = activeTables.length;

  // Añadir al configMap como valores dinámicos
  configMap.dynamic_max_capacity = String(totalCapacity);
  configMap.dynamic_max_pax = String(maxPaxInSingleTable);
  configMap.dynamic_active_tables = String(activeTablesCount);

  return configMap;
}

/**
 * Obtiene el número máximo de comensales permitido en una sola mesa
 */
async function getMaxPax() {
  const maxTable = await prisma.table.findFirst({
    where: { isActive: true },
    orderBy: { maxCapacity: 'desc' }
  });
  
  return maxTable ? maxTable.maxCapacity : 12; // Valor por defecto si no hay mesas
}

async function getPublicFrontendConfig() {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'specialties_config',
          'restaurant_name',
          'restaurant_address',
          'restaurant_phone',
          'restaurant_email'
        ]
      }
    }
  });

  const configMap = {};
  configs.forEach((config) => {
    configMap[config.key] = config.value;
  });

  let specialties = DEFAULT_SPECIALTIES;
  if (configMap.specialties_config) {
    try {
      specialties = JSON.parse(configMap.specialties_config);
    } catch (error) {
      console.error('Error parsing specialties config', error);
    }
  }

  return {
    ...DEFAULT_PUBLIC_CONFIG,
    ...Object.fromEntries(
      Object.keys(DEFAULT_PUBLIC_CONFIG).map((key) => [key, configMap[key] || DEFAULT_PUBLIC_CONFIG[key]])
    ),
    specialties
  };
}

module.exports = {
  getFullConfig,
  getMaxPax,
  getPublicFrontendConfig
};
