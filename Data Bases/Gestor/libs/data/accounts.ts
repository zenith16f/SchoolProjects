import { prisma } from "@/lib/prisma";
export const fetchAccounts = async (idUsuario: number) => {
  const accounts = await prisma.cuenta.findMany({
    where: {
      idUsuario: idUsuario,
    },
  });
  return accounts;
};

export const fetchAccount = async (idAccount: number) => {
  const account = await prisma.cuenta.findUnique({
    where: { idCuenta: idAccount },
    select: {
      idCuenta: true,
      nombre: true,
      tipo: true,
      saldoInicial: true,
      saldoActual: true,
      moneda: true,
      activa: true,
      fechaCreacion: true,
    },
  });

  // Serializar para evitar problemas con Decimal y Date
  return account ? JSON.parse(JSON.stringify(account)) : null;
};
