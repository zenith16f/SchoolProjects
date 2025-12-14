import { prisma } from "@/lib/prisma";

export const fetchOperations = async (idUsuario: number) => {
  const operations = await prisma.transaccion.findMany({
    where: {
      idUsuario: idUsuario,
    },
    include: {
      categoria: true,
      cuenta: true,
    },
    orderBy: {
      fecha: "desc",
    },
  });

  return operations.map((op) => ({
    ...op,
    monto: Number(op.monto), // ← Convertir Decimal a number
    fecha: op.fecha.toISOString().split("T")[0], // ← Date a string "YYYY-MM-DD"
    createdAt: op.createdAt.toISOString(),
    updatedAt: op.updatedAt.toISOString(),
    cuenta: {
      ...op.cuenta,
      saldoInicial: Number(op.cuenta.saldoInicial),
      saldoActual: Number(op.cuenta.saldoActual),
    },
  }));
};

export const fetchOperation = async (idOperation: number) => {
  const operation = await prisma.transaccion.findUnique({
    where: { idTransaccion: idOperation },
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
  });

  // Serializar para evitar problemas con Decimal y Date
  return operation ? JSON.parse(JSON.stringify(operation)) : null;
};
