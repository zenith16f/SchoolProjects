import {
  IconoCategoria,
  Moneda,
  PrismaClient,
  TipoCuenta,
  TipoTransaccion,
} from "@/generated/prisma/client";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes
  await prisma.aportacion.deleteMany();
  await prisma.metaAhorro.deleteMany();
  await prisma.transaccion.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.cuenta.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("✅ Datos anteriores eliminados");

  // Crear usuario de prueba
  //const hashedPassword = await bcrypt.hash("demo123", 10);
  const hashedPassword = "test123";

  const usuario = await prisma.usuario.create({
    data: {
      username: "demo",
      email: "demo@kaizen.com",
      password: hashedPassword,
    },
  });

  console.log("✅ Usuario creado:", usuario.username);

  // Crear cuentas
  const cuentas = await Promise.all([
    prisma.cuenta.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Cuenta Principal",
        tipo: TipoCuenta.banco,
        saldoInicial: 10000,
        saldoActual: 15420.5,
        moneda: Moneda.MXN,
      },
    }),
    prisma.cuenta.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Efectivo",
        tipo: TipoCuenta.efectivo,
        saldoInicial: 1000,
        saldoActual: 1200,
        moneda: Moneda.MXN,
      },
    }),
    prisma.cuenta.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Tarjeta de Débito",
        tipo: TipoCuenta.tarjeta_debito,
        saldoInicial: 5000,
        saldoActual: 4800,
        moneda: Moneda.MXN,
      },
    }),
    prisma.cuenta.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Ahorros",
        tipo: TipoCuenta.ahorro,
        saldoInicial: 20000,
        saldoActual: 22000,
        moneda: Moneda.MXN,
      },
    }),
  ]);

  console.log(`✅ ${cuentas.length} cuentas creadas`);

  // Crear categorías
  const categorias = await Promise.all([
    // EGRESOS
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Alimentos",
        tipo: TipoTransaccion.egreso,
        descripcion: "Supermercado, restaurantes y compras de comida",
        icono: IconoCategoria.coffee,
        color: "#EF4444",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Restaurantes",
        tipo: TipoTransaccion.egreso,
        descripcion: "Comidas fuera de casa",
        icono: IconoCategoria.coffee,
        color: "#F97316",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Compras",
        tipo: TipoTransaccion.egreso,
        descripcion: "Compras generales",
        icono: IconoCategoria.shopping_cart,
        color: "#8B5CF6",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Ropa",
        tipo: TipoTransaccion.egreso,
        descripcion: "Vestuario y accesorios",
        icono: IconoCategoria.shopping_cart,
        color: "#EC4899",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Tecnología",
        tipo: TipoTransaccion.egreso,
        descripcion: "Gadgets y electrónicos",
        icono: IconoCategoria.shopping_cart,
        color: "#3B82F6",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Streaming",
        tipo: TipoTransaccion.egreso,
        descripcion: "Netflix, Spotify, etc.",
        icono: IconoCategoria.tv,
        color: "#14B8A6",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Entretenimiento",
        tipo: TipoTransaccion.egreso,
        descripcion: "Cine, eventos, ocio",
        icono: IconoCategoria.tv,
        color: "#06B6D4",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Transporte",
        tipo: TipoTransaccion.egreso,
        descripcion: "Gasolina, Uber, transporte",
        icono: IconoCategoria.car,
        color: "#F59E0B",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Salud",
        tipo: TipoTransaccion.egreso,
        descripcion: "Médico, medicinas, gym",
        icono: IconoCategoria.heart,
        color: "#10B981",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Educación",
        tipo: TipoTransaccion.egreso,
        descripcion: "Cursos, libros, materiales",
        icono: IconoCategoria.book,
        color: "#6366F1",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Hogar",
        tipo: TipoTransaccion.egreso,
        descripcion: "Renta, servicios, mantenimiento",
        icono: IconoCategoria.home,
        color: "#84CC16",
      },
    }),
    // INGRESOS
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Salario",
        tipo: TipoTransaccion.ingreso,
        descripcion: "Ingreso mensual por nómina",
        icono: IconoCategoria.dollar,
        color: "#22C55E",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Freelance",
        tipo: TipoTransaccion.ingreso,
        descripcion: "Trabajos independientes",
        icono: IconoCategoria.dollar,
        color: "#10B981",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Inversiones",
        tipo: TipoTransaccion.ingreso,
        descripcion: "Rendimientos de inversiones",
        icono: IconoCategoria.dollar,
        color: "#059669",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Bonos",
        tipo: TipoTransaccion.ingreso,
        descripcion: "Bonificaciones y premios",
        icono: IconoCategoria.dollar,
        color: "#16A34A",
      },
    }),
    prisma.categoria.create({
      data: {
        idUsuario: usuario.idUsuario,
        nombre: "Otros Ingresos",
        tipo: TipoTransaccion.ingreso,
        descripcion: "Ingresos diversos",
        icono: IconoCategoria.dollar,
        color: "#4ADE80",
      },
    }),
  ]);

  console.log(`✅ ${categorias.length} categorías creadas`);

  // Crear transacciones
  const transacciones = await Promise.all([
    prisma.transaccion.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCuenta: cuentas[0].idCuenta,
        idCategoria: categorias[0].idCategoria,
        monto: 250.5,
        descripcion: "Café con amigos",
        fecha: new Date("2025-10-29"),
        notas: "Café en Starbucks con el equipo",
      },
    }),
    prisma.transaccion.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCuenta: cuentas[0].idCuenta,
        idCategoria: categorias[2].idCategoria,
        monto: 1000.5,
        descripcion: "Compra Supermercado",
        fecha: new Date("2025-10-29"),
        notas: "Compra semanal del hogar",
      },
    }),
    prisma.transaccion.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCuenta: cuentas[0].idCuenta,
        idCategoria: categorias[5].idCategoria,
        monto: 250.5,
        descripcion: "Suscripción Netflix",
        fecha: new Date("2025-10-29"),
        notas: "Plan premium familiar",
      },
    }),
    prisma.transaccion.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCuenta: cuentas[0].idCuenta,
        idCategoria: categorias[12].idCategoria,
        monto: 1500.5,
        descripcion: "Ingreso Extra",
        fecha: new Date("2025-10-29"),
        notas: "Proyecto freelance completado",
      },
    }),
    prisma.transaccion.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCuenta: cuentas[0].idCuenta,
        idCategoria: categorias[11].idCategoria,
        monto: 2800,
        descripcion: "Salario",
        fecha: new Date("2025-10-28"),
        notas: "Pago de nómina quincenal",
      },
    }),
  ]);

  console.log(`✅ ${transacciones.length} transacciones creadas`);

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\n📝 Credenciales de prueba:");
  console.log("   Email: demo@kaizen.com");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
