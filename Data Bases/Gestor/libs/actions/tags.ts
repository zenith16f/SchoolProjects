// libs/actions/categories.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  nombre: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .transform((val) => val.trim()),
  tipo: z.enum(["ingreso", "egreso"], {
    message: "Selecciona un tipo válido",
  }),
  descripcion: z.string().optional(),
  icono: z.string().min(1, "Selecciona un icono"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido"),
});

const updateCategorySchema = z.object({
  nombre: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .transform((val) => val.trim()),
  descripcion: z.string().optional(),
  icono: z.string().min(1, "Selecciona un icono"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido"),
});

export async function createCategory(idUsuario: number, formData: FormData) {
  const validated = categorySchema.safeParse({
    nombre: formData.get("nombre") as string,
    tipo: formData.get("tipo") as string,
    descripcion: (formData.get("descripcion") as string) || undefined,
    icono: formData.get("icono") as string,
    color: formData.get("color") as string,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error),
    };
  }

  const { nombre, tipo, descripcion, icono, color } = validated.data;

  try {
    // Verificar si ya existe (case-sensitive para MySQL)
    const existente = await prisma.categoria.findFirst({
      where: {
        idUsuario,
        nombre,
      },
    });

    if (existente) {
      return {
        success: false,
        error: "Ya existe una categoría con ese nombre",
      };
    }

    await prisma.categoria.create({
      data: {
        idUsuario,
        nombre,
        tipo: tipo as "ingreso" | "egreso",
        descripcion: descripcion || null,
        icono: icono as any,
        color,
        activa: true,
      },
    });

    revalidatePath("/Kaizen/tags");
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al crear la categoría" };
  }
}

export async function updateCategory(idCategoria: number, formData: FormData) {
  const validated = updateCategorySchema.safeParse({
    nombre: formData.get("nombre") as string,
    descripcion: (formData.get("descripcion") as string) || undefined,
    icono: formData.get("icono") as string,
    color: formData.get("color") as string,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { nombre, descripcion, icono, color } = validated.data;

  try {
    // Verificar que la categoría existe
    const categoriaActual = await prisma.categoria.findUnique({
      where: { idCategoria },
      select: { nombre: true, idUsuario: true, tipo: true },
    });

    if (!categoriaActual) {
      return { success: false, error: "Categoría no encontrada" };
    }

    // Verificar si el nombre ya existe para otra categoría del mismo usuario
    if (nombre !== categoriaActual.nombre) {
      const existente = await prisma.categoria.findFirst({
        where: {
          idUsuario: categoriaActual.idUsuario,
          nombre,
          idCategoria: {
            not: idCategoria, // Excluir la categoría actual
          },
        },
      });

      if (existente) {
        return {
          success: false,
          error: "Ya existe otra categoría con ese nombre",
        };
      }
    }

    // Actualizar la categoría (sin cambiar el tipo)
    await prisma.categoria.update({
      where: { idCategoria },
      data: {
        nombre,
        descripcion: descripcion || null,
        icono: icono as any,
        color,
      },
    });

    revalidatePath("/Kaizen/tags");
    revalidatePath(`/Kaizen/tags/${idCategoria}`);
    revalidatePath("/Kaizen"); // Dashboard

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

// Función para obtener categorías activas del usuario
export async function getActiveCategories(idUsuario: number) {
  const categorias = await prisma.categoria.findMany({
    where: {
      idUsuario,
      activa: true,
    },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });

  return JSON.parse(JSON.stringify(categorias));
}

export async function deleteCategory(
  idCategoria: number,
  nombreConfirmacion: string
) {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { idCategoria },
      select: { nombre: true },
    });

    if (!categoria) {
      return { success: false, error: "Categoría no encontrada" };
    }

    if (categoria.nombre !== nombreConfirmacion) {
      return { success: false, error: "El nombre no coincide" };
    }

    // Soft delete o hard delete según tu preferencia
    await prisma.categoria.update({
      where: { idCategoria },
      data: { activa: false },
    });

    revalidatePath("/Kaizen/tags");
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Error al desactivar la categoría" };
  }
}
