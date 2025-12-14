"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const operationSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
  descripcion: z.string().min(3, "Mínimo 3 caracteres"),
  idCategoria: z.number(),
  idCuenta: z.number(),
  fecha: z.string(),
  notas: z.string().optional(),
});

const updateOperationSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
  descripcion: z.string().min(3, "Mínimo 3 caracteres"),
  idCategoria: z.number(),
  idCuenta: z.number(),
  fecha: z.string(),
  notas: z.string().optional(),
});

export async function createOperation(formData: FormData) {
  const validated = operationSchema.safeParse({
    monto: parseFloat(formData.get("monto") as string),
    descripcion: formData.get("descripcion") as string,
    idCategoria: parseInt(formData.get("idCategoria") as string),
    idCuenta: parseInt(formData.get("idCuenta") as string),
    fecha: formData.get("fecha") as string,
    notas: (formData.get("notas") as string) || undefined,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error),
    };
  }

  const { monto, descripcion, idCategoria, idCuenta, fecha, notas } =
    validated.data;

  try {
    // Obtener el tipo de categoría (ingreso o egreso)
    const categoria = await prisma.categoria.findUnique({
      where: { idCategoria },
      select: { tipo: true, idUsuario: true },
    });

    if (!categoria) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Obtener la cuenta
    const cuenta = await prisma.cuenta.findUnique({
      where: { idCuenta },
      select: { saldoActual: true },
    });

    if (!cuenta) {
      return { success: false, error: "Cuenta no encontrada" };
    }

    // Calcular nuevo saldo
    const ajuste = categoria.tipo === "ingreso" ? monto : -monto;
    const nuevoSaldo = Number(cuenta.saldoActual) + ajuste;

    // Crear transacción y actualizar saldo en una transacción de BD
    await prisma.$transaction([
      // Crear la transacción
      prisma.transaccion.create({
        data: {
          idUsuario: categoria.idUsuario,
          idCuenta,
          idCategoria,
          monto,
          descripcion,
          fecha: new Date(fecha),
          notas: notas || null,
        },
      }),
      // Actualizar saldo de la cuenta
      prisma.cuenta.update({
        where: { idCuenta },
        data: { saldoActual: nuevoSaldo },
      }),
    ]);

    revalidatePath("/Kaizen/operations");
    revalidatePath("/Kaizen"); // Revalidar dashboard
    revalidatePath("/Kaizen/accounts"); // Revalidar cuentas

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al crear la operación" };
  }
}

export async function updateOperation(
  idTransaccion: number,
  formData: FormData
) {
  const validated = updateOperationSchema.safeParse({
    monto: parseFloat(formData.get("monto") as string),
    descripcion: formData.get("descripcion") as string,
    idCategoria: parseInt(formData.get("idCategoria") as string),
    idCuenta: parseInt(formData.get("idCuenta") as string),
    fecha: formData.get("fecha") as string,
    notas: (formData.get("notas") as string) || undefined,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error),
    };
  }

  const { monto, descripcion, idCategoria, idCuenta, fecha, notas } =
    validated.data;

  try {
    // Obtener la transacción actual
    const transaccionActual = await prisma.transaccion.findUnique({
      where: { idTransaccion },
      include: {
        categoria: true,
      },
    });

    if (!transaccionActual) {
      return { success: false, error: "Transacción no encontrada" };
    }

    // Obtener la nueva categoría
    const nuevaCategoria = await prisma.categoria.findUnique({
      where: { idCategoria },
      select: { tipo: true },
    });

    if (!nuevaCategoria) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Calcular ajustes de saldo
    const montoAnterior = Number(transaccionActual.monto);
    const tipoAnterior = transaccionActual.categoria.tipo;
    const cuentaAnterior = transaccionActual.idCuenta;

    // Revertir el efecto de la transacción anterior
    const ajusteRevertir =
      tipoAnterior === "ingreso" ? -montoAnterior : montoAnterior;

    // Aplicar el efecto de la nueva transacción
    const ajusteNuevo = nuevaCategoria.tipo === "ingreso" ? monto : -monto;

    // Si cambió de cuenta, ajustar ambas cuentas
    if (cuentaAnterior !== idCuenta) {
      // Revertir en cuenta anterior
      await prisma.cuenta.update({
        where: { idCuenta: cuentaAnterior },
        data: {
          saldoActual: {
            increment: ajusteRevertir,
          },
        },
      });

      // Aplicar en cuenta nueva
      await prisma.cuenta.update({
        where: { idCuenta },
        data: {
          saldoActual: {
            increment: ajusteNuevo,
          },
        },
      });
    } else {
      // Misma cuenta: aplicar la diferencia
      const ajusteTotal = ajusteRevertir + ajusteNuevo;
      await prisma.cuenta.update({
        where: { idCuenta },
        data: {
          saldoActual: {
            increment: ajusteTotal,
          },
        },
      });
    }

    // Actualizar la transacción
    await prisma.transaccion.update({
      where: { idTransaccion },
      data: {
        monto,
        descripcion,
        idCategoria,
        idCuenta,
        fecha: new Date(fecha),
        notas: notas || null,
      },
    });

    revalidatePath("/Kaizen/operations");
    revalidatePath(`/Kaizen/operations/${idTransaccion}`);
    revalidatePath("/Kaizen"); // Dashboard
    revalidatePath("/Kaizen/accounts"); // Cuentas

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al actualizar la operación" };
  }
}

export async function deleteOperation(
  idTransaccion: number,
  descripcionConfirmacion: string
) {
  try {
    // Verificar que la transacción existe y obtener su descripción
    const transaccion = await prisma.transaccion.findUnique({
      where: { idTransaccion },
      select: {
        descripcion: true,
        monto: true,
        idCuenta: true,
        categoria: {
          select: {
            tipo: true,
          },
        },
      },
    });

    if (!transaccion) {
      return { success: false, error: "Transacción no encontrada" };
    }

    if (transaccion.descripcion !== descripcionConfirmacion) {
      return { success: false, error: "La descripción no coincide" };
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { idCuenta: transaccion.idCuenta },
      select: { saldoActual: true },
    });

    if (cuenta) {
      // Si es ingreso, restar del saldo. Si es egreso, sumar al saldo
      const ajuste =
        transaccion.categoria.tipo === "ingreso"
          ? -Number(transaccion.monto) // Restar el ingreso
          : Number(transaccion.monto); // Sumar el egreso (devolver el dinero)

      await prisma.cuenta.update({
        where: { idCuenta: transaccion.idCuenta },
        data: {
          saldoActual: Number(cuenta.saldoActual) + ajuste,
        },
      });
    }

    // Hard delete - eliminación permanente
    await prisma.transaccion.delete({
      where: { idTransaccion },
    });

    revalidatePath("/Kaizen/operations");
    revalidatePath("/Kaizen"); // Revalidar dashboard también

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al eliminar la transacción" };
  }
}
