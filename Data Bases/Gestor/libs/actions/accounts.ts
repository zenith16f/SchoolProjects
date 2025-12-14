"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const accountSchema = z.object({
  nombre: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .transform((val) => val.trim()),
  tipo: z.enum(
    ["banco", "efectivo", "tarjeta_debito", "tarjeta_credito", "ahorro"],
    {
      message: "Selecciona un tipo válido",
    }
  ),
  saldoInicial: z.number().min(0, "El saldo debe ser mayor o igual a 0"),
  moneda: z.enum(["MXN", "USD", "EUR", "CAD"], {
    message: "Selecciona una moneda válida",
  }),
});

const updateAccountSchema = z.object({
  nombre: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .transform((val) => val.trim()),
  tipo: z.enum(
    ["banco", "efectivo", "tarjeta_debito", "tarjeta_credito", "ahorro"],
    {
      message: "Selecciona un tipo válido",
    }
  ),
  saldoActual: z.number(),
});

export async function createAccount(idUsuario: number, formData: FormData) {
  const validated = accountSchema.safeParse({
    nombre: formData.get("nombre") as string,
    tipo: formData.get("tipo") as string,
    saldoInicial: parseFloat(formData.get("saldoInicial") as string),
    moneda: formData.get("moneda") as string,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { nombre, tipo, saldoInicial, moneda } = validated.data;

  try {
    // Verificar si ya existe una cuenta con ese nombre para el usuario
    const existente = await prisma.cuenta.findFirst({
      where: {
        idUsuario,
        nombre,
      },
    });

    if (existente) {
      return {
        success: false,
        error: "Ya existe una cuenta con ese nombre",
      };
    }

    await prisma.cuenta.create({
      data: {
        idUsuario,
        nombre,
        tipo: tipo as any,
        saldoInicial,
        saldoActual: saldoInicial, // Inicialmente el saldo actual = saldo inicial
        moneda: moneda as any,
        activa: true,
      },
    });

    revalidatePath("/Kaizen/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al crear la cuenta" };
  }
}

export async function updateAccount(idCuenta: number, formData: FormData) {
  const validated = updateAccountSchema.safeParse({
    nombre: formData.get("nombre") as string,
    tipo: formData.get("tipo") as string,
    saldoActual: parseFloat(formData.get("saldoActual") as string),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { nombre, tipo, saldoActual } = validated.data;

  try {
    // Verificar que la cuenta existe
    const cuentaActual = await prisma.cuenta.findUnique({
      where: { idCuenta },
      select: { nombre: true, idUsuario: true },
    });

    if (!cuentaActual) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Verificar si el nombre ya existe para otro registro del mismo usuario
    if (nombre !== cuentaActual.nombre) {
      const existente = await prisma.cuenta.findFirst({
        where: {
          idUsuario: cuentaActual.idUsuario,
          nombre,
          idCuenta: {
            not: idCuenta, // Excluir la cuenta actual
          },
        },
      });

      if (existente) {
        return {
          success: false,
          error: "Ya existe otra cuenta con ese nombre",
        };
      }
    }

    // Actualizar la cuenta
    await prisma.cuenta.update({
      where: { idCuenta },
      data: {
        nombre,
        tipo: tipo as any,
        saldoActual,
      },
    });

    revalidatePath("/Kaizen/accounts");
    revalidatePath(`/Kaizen/accounts/${idCuenta}`);
    revalidatePath("/Kaizen"); // Dashboard

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al actualizar la cuenta" };
  }
}

export async function getActiveAccounts(idUsuario: number) {
  const cuentas = await prisma.cuenta.findMany({
    where: {
      idUsuario,
      activa: true,
    },
    orderBy: { nombre: "asc" },
  });

  return JSON.parse(JSON.stringify(cuentas));
}

export async function deleteAccount(
  idCuenta: number,
  nombreConfirmacion: string
) {
  try {
    // Verificar que la cuenta existe y obtener su nombre
    const cuenta = await prisma.cuenta.findUnique({
      where: { idCuenta },
      select: { nombre: true },
    });

    if (!cuenta) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Verificar que el nombre coincide
    if (cuenta.nombre !== nombreConfirmacion) {
      return { success: false, error: "El nombre no coincide" };
    }

    // Soft delete
    await prisma.cuenta.update({
      where: { idCuenta },
      data: { activa: false },
    });

    revalidatePath("/Kaizen/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }
}
