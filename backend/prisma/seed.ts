import 'dotenv/config'
import { PrismaClient, BookingStatus, Language } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 INICIANDO SEED DEL MESÓN MARINERO...')

  // 1. LIMPIEZA (orden inverso por claves foráneas)
  await prisma.waitlist.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.closure.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.table.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.customerNote.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.menuCategory.deleteMany()
  await prisma.systemConfig.deleteMany()

  console.log('🧹 Base de datos limpia.')

  // ------------------------------------------------------------------
  // 2. PERSONAL (Admin)
  // ------------------------------------------------------------------
  const passwordHash = await bcrypt.hash('admin1234', 10)

  await prisma.staff.create({
    data: {
      email: 'admin@mesonmarinero.com',
      passwordHash,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('✅ Staff admin creado: admin@mesonmarinero.com / admin1234')

  // ------------------------------------------------------------------
  // 3. TURNO: solo Comidas, Martes-Sábado, 13:30–17:00
  // daysOfWeek: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles,
  //             4=Jueves, 5=Viernes, 6=Sábado
  // ------------------------------------------------------------------
  await prisma.shift.createMany({
    data: [
      {
        name: 'Comidas',
        startTime: '13:30',
        endTime: '17:00',
        isActive: true,
        slotInterval: 30, // Slots: 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00
        daysOfWeek: [0, 2, 3, 4, 5, 6] // Todos los días menos Lunes (0=Domingo, 1=Lunes)
      },
      {
        name: 'Cenas',
        startTime: '20:30',
        endTime: '23:30',
        isActive: true,
        slotInterval: 30,
        daysOfWeek: [0, 2, 3, 4, 5, 6] // Todos los días menos Lunes
      }
    ]
  })

  console.log('✅ Turnos creados: Comidas y Cenas (Martes a Domingo)')

  // ------------------------------------------------------------------
  // 4. ZONA: Solo Salón Principal
  // ------------------------------------------------------------------
  const salon = await prisma.zone.create({
    data: {
      name: 'Salón Principal',
      description: 'Salón interior del restaurante',
      isActive: true,
      displayOrder: 1
    }
  })

  console.log('✅ Zona creada: Salón Principal')

  // ------------------------------------------------------------------
  // 5. MESAS del Salón Principal
  // Mix de capacidades para cubrir grupos de 1 a 12 personas
  // ------------------------------------------------------------------
  const mesasData = [
    // Mesas para 2 personas
    { name: 'Mesa 1', minCapacity: 1, maxCapacity: 2, zoneId: salon.id },
    { name: 'Mesa 2', minCapacity: 1, maxCapacity: 2, zoneId: salon.id },
    { name: 'Mesa 3', minCapacity: 1, maxCapacity: 2, zoneId: salon.id },
    { name: 'Mesa 4', minCapacity: 1, maxCapacity: 2, zoneId: salon.id },
    // Mesas para 4 personas
    { name: 'Mesa 5', minCapacity: 2, maxCapacity: 4, zoneId: salon.id },
    { name: 'Mesa 6', minCapacity: 2, maxCapacity: 4, zoneId: salon.id },
    { name: 'Mesa 7', minCapacity: 2, maxCapacity: 4, zoneId: salon.id },
    { name: 'Mesa 8', minCapacity: 2, maxCapacity: 4, zoneId: salon.id },
    { name: 'Mesa 9', minCapacity: 2, maxCapacity: 4, zoneId: salon.id },
    // Mesas para 6 personas
    { name: 'Mesa 10', minCapacity: 4, maxCapacity: 6, zoneId: salon.id },
    { name: 'Mesa 11', minCapacity: 4, maxCapacity: 6, zoneId: salon.id },
    { name: 'Mesa 12', minCapacity: 4, maxCapacity: 6, zoneId: salon.id },
    // Mesas grandes
    { name: 'Mesa 13', minCapacity: 6, maxCapacity: 8, zoneId: salon.id },
    { name: 'Mesa 14', minCapacity: 6, maxCapacity: 10, zoneId: salon.id },
    { name: 'Mesa 15', minCapacity: 8, maxCapacity: 12, zoneId: salon.id },
  ]

  await prisma.table.createMany({ data: mesasData })

  console.log(`✅ ${mesasData.length} mesas creadas en el Salón Principal`)

  // ------------------------------------------------------------------
  // 6. CLIENTES CRM DE EJEMPLO
  // ------------------------------------------------------------------
  await prisma.customer.createMany({
    data: [
      {
        email: 'ad@ad.com',
        phone: '645464745',
        firstName: 'Juan',
        lastName: 'martin ',
        language: Language.ES,
        allergens: [],
        totalVisits: 1,
        tags: []
      },
      {
        email: 'alejandro.molina@aircury.com',
        phone: '6020003434',
        firstName: 'Alex',
        lastName: 'sadasd',
        language: Language.ES,
        allergens: [],
        totalVisits: 2,
        tags: []
      },
      {
        email: 'alergico@alergias.com',
        phone: '234054505',
        firstName: 'Alegico',
        lastName: 'Garcia Lopez',
        language: Language.ES,
        allergens: ['Marisco', 'Gluten', 'Cebolla', 'Vino', 'Arroz', 'Frutos seco', 'Brocoli', 'Formol'],
        totalVisits: 1,
        tags: []
      },
      {
        email: 'bloqueado@example.com',
        phone: '+34000000000',
        firstName: 'Cliente',
        lastName: 'Bloqueado',
        language: Language.ES,
        allergens: [],
        totalVisits: 3,
        isBlacklisted: true,
        tags: ['BLACKLIST'],
        totalNoShows: 3,
        blacklistReason: 'No se presenta'
      },
      {
        email: 'carlitos@mail.com',
        phone: '623003090',
        firstName: 'Carlos',
        lastName: 'Herrera',
        language: Language.ES,
        allergens: [],
        totalVisits: 1,
        tags: []
      },
      {
        email: 'carlos.nuez@example.com',
        phone: '+34666000666',
        firstName: 'Carlos',
        lastName: 'Nùñez',
        language: Language.ES,
        allergens: ['Frutos Secos', 'Marisco'],
        preferences: 'Prefiere evitar contaminación cruzada y mesa ventilada.',
        totalVisits: 2,
        tags: []
      },
      {
        email: 'corre@test.com',
        phone: '623963958',
        firstName: 'Marta',
        lastName: 'Canseco Zorita',
        language: Language.ES,
        allergens: ['Gluten'],
        preferences: 'Si es posible, pan sin gluten para la mesa.',
        totalVisits: 1,
        tags: []
      },
      {
        email: 'juan@example.com',
        phone: '600123456',
        firstName: 'Juan',
        lastName: 'Pérez',
        language: Language.ES,
        allergens: [],
        totalVisits: 4,
        tags: []
      },
      {
        email: 'juan.perez@example.com',
        phone: '6020003439',
        firstName: 'Nacho',
        lastName: 'sadsasad',
        language: Language.ES,
        allergens: [],
        totalVisits: 7,
        isVip: true,
        tags: ['VIP']
      },
      {
        email: 'maria@eme.com',
        phone: '345934596',
        firstName: 'Nacho',
        lastName: 'Garcia',
        language: Language.ES,
        allergens: [],
        totalVisits: 1,
        tags: []
      },
      {
        email: 'maria.garcia@example.com',
        phone: '+34611222333',
        firstName: 'María',
        lastName: 'García Updated',
        language: Language.ES,
        allergens: ['Nueces'],
        preferences: 'Mesa tranquila. Agua sin gas.',
        totalVisits: 24,
        isVip: true,
        tags: ['VIP']
      },
      {
        email: 'test@test.com',
        phone: '234883848',
        firstName: 'Nacho',
        lastName: 'Cabrera',
        language: Language.ES,
        allergens: ['Marisco'],
        totalVisits: 1,
        tags: []
      }
    ]
  })

  console.log('✅ 12 Clientes CRM cargados desde la BD actual')

  // ------------------------------------------------------------------
  // 7. CONFIGURACIÓN PÚBLICA / SISTEMA (según BD actual)
  // ------------------------------------------------------------------
  await prisma.systemConfig.createMany({
    data: [
      { key: 'restaurant_name', value: 'Mesón Marinero' },
      { key: 'restaurant_address', value: 'Calle del Puerto, 12 — Alicante' },
      { key: 'restaurant_phone', value: '965 00 00 00' },
      { key: 'restaurant_email', value: 'info@mesonmarinero.es' },
      { key: 'opening_days', value: '1,3,5,6,0' }
    ]
  })

  console.log('✅ Configuración pública y operativa sincronizada con la BD actual')

  // ------------------------------------------------------------------
  // 8. RESERVAS DE PRUEBA centradas en la semana del 4 al 9 de mayo
  // ------------------------------------------------------------------
  const customers = await prisma.customer.findMany()
  const tables = await prisma.table.findMany()

  const customerByEmail = new Map(customers.map((customer) => [customer.email, customer]))
  const tableByName = new Map(tables.map((table) => [table.name, table]))

  function buildDate(date: string, time: string) {
    return new Date(`${date}T${time}:00`)
  }

  const bookingsData = [
    {
      date: '2026-05-05',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.COMPLETED,
      customerEmail: 'alergico@alergias.com',
      tableName: 'Mesa 1',
      specialRequests: 'Tengo Alergias',
      completedAt: buildDate('2026-05-05', '15:00')
    },
    {
      date: '2026-05-05',
      time: '14:00',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'ad@ad.com',
      tableName: 'Mesa 2',
      specialRequests: 'Mesa cerca de la ventana',
      confirmationToken: 'demo-may-001',
      confirmedAt: buildDate('2026-05-01', '10:00')
    },
    {
      date: '2026-05-05',
      time: '14:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan.perez@example.com',
      tableName: 'Mesa 3',
      specialRequests: 'Celebración tranquila, si puede ser en esquina',
      confirmationToken: 'demo-may-002',
      confirmedAt: buildDate('2026-05-01', '10:15')
    },
    {
      date: '2026-05-05',
      time: '16:00',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'alejandro.molina@aircury.com',
      tableName: 'Mesa 1',
      specialRequests: 'alergia al pan',
      confirmationToken: 'demo-may-003',
      confirmedAt: buildDate('2026-05-01', '11:00')
    },
    {
      date: '2026-05-05',
      time: '20:30',
      pax: 4,
      duration: 120,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan@example.com',
      tableName: 'Mesa 5',
      specialRequests: 'Trona para niño',
      confirmationToken: 'demo-may-004',
      confirmedAt: buildDate('2026-05-01', '11:30')
    },
    {
      date: '2026-05-06',
      time: '13:30',
      pax: 3,
      duration: 120,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan.perez@example.com',
      tableName: 'Mesa 5',
      specialRequests: 'Cumpleaños de mi esposa',
      confirmationToken: 'demo-may-005',
      confirmedAt: buildDate('2026-05-02', '09:30')
    },
    {
      date: '2026-05-06',
      time: '14:00',
      pax: 6,
      duration: 150,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'maria.garcia@example.com',
      tableName: 'Mesa 10',
      specialRequests: 'Una comensal alérgica a frutos secos',
      confirmationToken: 'demo-may-006',
      confirmedAt: buildDate('2026-05-02', '09:45')
    },
    {
      date: '2026-05-06',
      time: '20:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'maria@eme.com',
      tableName: 'Mesa 1',
      specialRequests: 'Aniversario, postre con vela si es posible',
      confirmationToken: 'demo-may-007',
      confirmedAt: buildDate('2026-05-02', '10:00')
    },
    {
      date: '2026-05-07',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'carlitos@mail.com',
      tableName: 'Mesa 1',
      specialRequests: 'Sin prisa entre platos',
      confirmationToken: 'demo-may-008',
      confirmedAt: buildDate('2026-05-03', '09:00')
    },
    {
      date: '2026-05-07',
      time: '14:00',
      pax: 4,
      duration: 120,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'corre@test.com',
      tableName: 'Mesa 5',
      specialRequests: 'Voy con un bebe',
      confirmationToken: 'demo-may-009',
      confirmedAt: buildDate('2026-05-03', '09:15')
    },
    {
      date: '2026-05-08',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CANCELLED,
      customerEmail: 'test@test.com',
      tableName: 'Mesa 1',
      specialRequests: 'Alergia al marisco'
    },
    {
      date: '2026-05-08',
      time: '20:30',
      pax: 6,
      duration: 150,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'maria.garcia@example.com',
      tableName: 'Mesa 10',
      specialRequests: 'Mesa tranquila. Agua sin gas.',
      confirmationToken: 'demo-may-010',
      confirmedAt: buildDate('2026-05-03', '12:00')
    },
    {
      date: '2026-05-09',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan@example.com',
      tableName: 'Mesa 1',
      specialRequests: 'Llegaremos con carrito de bebé',
      confirmationToken: 'demo-may-011',
      confirmedAt: buildDate('2026-05-04', '09:00')
    },
    {
      date: '2026-05-09',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan@example.com',
      tableName: 'Mesa 2',
      specialRequests: 'Cumpleaños, traer tarta al final',
      confirmationToken: 'demo-may-012',
      confirmedAt: buildDate('2026-05-04', '09:05')
    },
    {
      date: '2026-05-09',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan@example.com',
      tableName: 'Mesa 3',
      specialRequests: 'Necesitan espacio para silla infantil',
      confirmationToken: 'demo-may-013',
      confirmedAt: buildDate('2026-05-04', '09:10')
    },
    {
      date: '2026-05-09',
      time: '13:30',
      pax: 2,
      duration: 90,
      status: BookingStatus.CONFIRMED,
      customerEmail: 'juan@example.com',
      tableName: 'Mesa 4',
      specialRequests: 'Sin gluten para uno de los comensales',
      confirmationToken: 'demo-may-014',
      confirmedAt: buildDate('2026-05-04', '09:15')
    }
  ]

  for (const booking of bookingsData) {
    const customer = customerByEmail.get(booking.customerEmail)
    const table = tableByName.get(booking.tableName)

    if (!customer || !table) {
      throw new Error(`No se encontró customer/table para ${booking.customerEmail} / ${booking.tableName}`)
    }

    await prisma.booking.create({
      data: {
        date: buildDate(booking.date, booking.time),
        pax: booking.pax,
        duration: booking.duration,
        status: booking.status,
        customerId: customer.id,
        tableId: table.id,
        specialRequests: booking.specialRequests ?? null,
        confirmationToken: booking.confirmationToken,
        confirmedAt: booking.confirmedAt,
        completedAt: booking.completedAt
      }
    })
  }

  console.log(`✅ ${bookingsData.length} reservas de prueba creadas en la semana objetivo`)
  
  // ------------------------------------------------------------------
  // 9. CARTA / MENÚ (según la BD actual)
  // ------------------------------------------------------------------
  const cartaData = [
    {
      name: 'ENTRANTES FRÍOS',
      description: null,
      isActive: true,
      displayOrder: 0,
      items: [
        { name: 'Carpaccio de ventresca de atún rojo', description: null, price: '20€', isActive: true, displayOrder: 1 },
        { name: 'Hueva de mújol en semi salazón con almendra marcona', description: null, price: '11€', isActive: true, displayOrder: 2 },
        { name: 'Anchoa de Lolin', description: null, price: '3€', isActive: true, displayOrder: 3 },
        { name: 'Nuestra marinera', description: null, price: '4.5 / 6€', isActive: true, displayOrder: 4 },
        { name: 'Ensaladilla de pulpo', description: null, price: '10 / 17€', isActive: true, displayOrder: 5 },
        { name: 'Sardina ahumada', description: null, price: '5€', isActive: true, displayOrder: 6 },
        { name: 'Ensalada de ventresca de bonito', description: null, price: '20€', isActive: true, displayOrder: 7 },
        { name: 'Ensalada de sardina ahumada', description: null, price: '19.5€', isActive: true, displayOrder: 8 },
        { name: 'Cecina de Astorga', description: null, price: '10 / 17€', isActive: true, displayOrder: 9 },
        { name: 'Embutidos de Guadalest Casa Gloria', description: null, price: '8 / 12€', isActive: true, displayOrder: 10 },
        { name: 'Tabla de quesos', description: null, price: '10 / 16€', isActive: true, displayOrder: 11 }
      ]
    },
    {
      name: 'ENTRANTES CALIENTES',
      description: null,
      isActive: true,
      displayOrder: 1,
      items: [
        { name: 'Croquetas caseras', description: null, price: '3€', isActive: true, displayOrder: 1 },
        { name: 'Sepionet plancha', description: null, price: '12 / 20€', isActive: true, displayOrder: 2 },
        { name: 'Puntilla encebollada / Chipirón plancha', description: null, price: '21 / 11€ unidad', isActive: true, displayOrder: 3 },
        { name: 'Chipirón encebollado', description: null, price: '11€ unidad', isActive: true, displayOrder: 4 },
        { name: 'Almejas a la marinera', description: null, price: '21€', isActive: true, displayOrder: 5 },
        { name: 'Mejillones al vapor', description: null, price: '12€', isActive: true, displayOrder: 6 },
        { name: 'Mejillones picantones', description: null, price: '12€', isActive: true, displayOrder: 7 },
        { name: 'Pulpo dos cocciones', description: null, price: '22€', isActive: true, displayOrder: 8 }
      ]
    },
    {
      name: 'LOS MÁS ESPECIALES',
      description: null,
      isActive: true,
      displayOrder: 2,
      items: [
        { name: 'Quisquilla 100gr.', description: null, price: '17€', isActive: true, displayOrder: 1 },
        { name: 'Gamba roja 1ª', description: null, price: 'S. Mercado', isActive: true, displayOrder: 2 },
        { name: 'Salpicón de langosta', description: null, price: 'S. Mercado', isActive: true, displayOrder: 3 }
      ]
    },
    {
      name: 'PARA DAR LA LATA',
      description: null,
      isActive: true,
      displayOrder: 3,
      items: [
        { name: 'Caviar Tanit King Gold Lata 10 gr.', description: null, price: '30€', isActive: true, displayOrder: 1 },
        { name: 'Navajas al natural Real Conservera Española', description: null, price: '22€', isActive: true, displayOrder: 2 },
        { name: 'Mejillones en escabeche con papas', description: null, price: '16€', isActive: true, displayOrder: 3 },
        { name: 'Sardinillas en aceite Real Conservera Española', description: null, price: '22€', isActive: true, displayOrder: 4 }
      ]
    },
    {
      name: 'INDIVIDUALES',
      description: null,
      isActive: true,
      displayOrder: 4,
      items: [
        { name: 'Merluza rebozada', description: null, price: '24€', isActive: true, displayOrder: 1 },
        { name: 'Ventresca de atún rojo', description: null, price: '30€', isActive: true, displayOrder: 2 },
        { name: 'Solomillo de ternera', description: null, price: '25€', isActive: true, displayOrder: 3 }
      ]
    },
    {
      name: 'SEGUNDOS COMPARTIR (Precio por persona)',
      description: null,
      isActive: true,
      displayOrder: 5,
      items: [
        { name: 'Rodaballo a la castreña', description: null, price: '30€', isActive: true, displayOrder: 1 },
        { name: 'Cogote de merluza', description: null, price: '24€', isActive: true, displayOrder: 2 },
        { name: 'Lubina a la espalda', description: null, price: '29€', isActive: true, displayOrder: 3 },
        { name: 'Cherna al horno', description: null, price: '29€', isActive: true, displayOrder: 4 },
        { name: 'Dentón a la espalda', description: null, price: '30€', isActive: true, displayOrder: 5 },
        { name: 'Urta a la espalda', description: null, price: '29€', isActive: true, displayOrder: 6 },
        { name: 'Besugo a la espalda', description: null, price: '35€', isActive: true, displayOrder: 7 },
        { name: 'Cabracho al horno', description: null, price: '30€', isActive: true, displayOrder: 8 },
        { name: 'Corvina a la espalda', description: null, price: '25€', isActive: true, displayOrder: 9 },
        { name: 'Chuleta de vaca (Precio pieza)', description: null, price: '42€/kilo', isActive: true, displayOrder: 10 }
      ]
    },
    {
      name: 'Acompañamientos y Extras',
      description: null,
      isActive: true,
      displayOrder: 6,
      items: [
        { name: 'Pan de pueblo', description: null, price: '1€ P.P.', isActive: true, displayOrder: 1 },
        { name: 'Salsas extra', description: null, price: '1€', isActive: true, displayOrder: 2 },
        { name: 'Aceitunas', description: null, price: '1€', isActive: true, displayOrder: 3 },
        { name: 'Almendras fritas', description: null, price: '2.5€', isActive: true, displayOrder: 4 },
        { name: 'Aceite Verdeliss', description: null, price: '1.5€ P.P.', isActive: true, displayOrder: 5 }
      ]
    }
  ];

  for (const cat of cartaData) {
    await prisma.menuCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        isActive: cat.isActive,
        displayOrder: cat.displayOrder,
        items: {
          create: cat.items
        }
      }
    });
  }

  console.log(`✅ Carta creada con ${cartaData.length} categorías`)
  console.log('')
  console.log('🚀 SEED COMPLETADO. Resumen:')
  console.log('   👤 Staff: admin@mesonmarinero.com / admin1234')
  console.log('   🕐 Turnos: Comidas (13:30-17:00) y Cenas (20:30-23:30), Martes a Domingo')
  console.log('   🏢 Zona: Salón Principal')
  console.log('   🪑 15 Mesas (capacidad 1-12 pax)')
  console.log('   👥 12 Clientes CRM')
  console.log('   ⚙️ 5 configuraciones de sistema')
  console.log('   📅 16 Reservas de prueba (semana del 4 al 9 de mayo de 2026)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
