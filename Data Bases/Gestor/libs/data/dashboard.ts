import { prisma } from "@/lib/prisma";
import { OperacionRelaciones } from "../interfaces/AppInterfaces";

interface DashboardData {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  operacionesRecientes: OperacionRelaciones[];
}

export async function fetchDashboard(
  idUsuario: number
): Promise<DashboardData> {
  // Obtener fecha de inicio y fin del mes actual
  const now = new Date();
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const ultimoDiaMes = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Obtener transacciones del mes actual
  const transaccionesDelMes = await prisma.transaccion.findMany({
    where: {
      idUsuario: idUsuario,
      fecha: {
        gte: primerDiaMes,
        lte: ultimoDiaMes,
      },
    },
    include: {
      categoria: {
        select: {
          idCategoria: true,
          nombre: true,
          tipo: true,
          icono: true,
          color: true,
        },
      },
      cuenta: {
        select: {
          idCuenta: true,
          nombre: true,
          tipo: true,
          saldoInicial: true,
          saldoActual: true,
          moneda: true,
        },
      },
    },
    orderBy: { fecha: "desc" },
  });

  console.log("Transacciones encontradas:", transaccionesDelMes.length);
  console.log(
    "Detalle transacciones:",
    transaccionesDelMes.map((t) => ({
      monto: t.monto,
      tipo: t.categoria?.tipo,
      fecha: t.fecha,
    }))
  );

  // Calcular totales - Asegurar que la categoría existe y convertir monto correctamente
  const totalIngresos = transaccionesDelMes
    .filter((t) => t.categoria && t.categoria.tipo === "ingreso")
    .reduce((sum, t) => {
      const monto = typeof t.monto === "number" ? t.monto : Number(t.monto);
      console.log("Ingreso:", monto);
      return sum + monto;
    }, 0);

  const totalEgresos = transaccionesDelMes
    .filter((t) => t.categoria && t.categoria.tipo === "egreso")
    .reduce((sum, t) => {
      const monto = typeof t.monto === "number" ? t.monto : Number(t.monto);
      console.log("Egreso:", monto);
      return sum + monto;
    }, 0);

  const balance = totalIngresos - totalEgresos;

  console.log("Totales calculados:", { totalIngresos, totalEgresos, balance });

  // Últimas 5 operaciones (de todas, no solo del mes)
  const operacionesRecientes = await prisma.transaccion.findMany({
    where: { idUsuario },
    include: {
      categoria: {
        select: {
          idCategoria: true,
          nombre: true,
          tipo: true,
          icono: true,
          color: true,
        },
      },
      cuenta: {
        select: {
          idCuenta: true,
          nombre: true,
          tipo: true,
          saldoInicial: true,
          saldoActual: true,
          moneda: true,
        },
      },
    },
    orderBy: { fecha: "desc" },
    take: 5,
  });

  console.log(totalIngresos, totalEgresos);

  return {
    totalIngresos,
    totalEgresos,
    balance,
    operacionesRecientes: JSON.parse(JSON.stringify(operacionesRecientes)),
  };
}
