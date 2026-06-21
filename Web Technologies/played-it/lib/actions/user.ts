"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
};

// Schema para actualizar perfil
const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  email: z
    .string()
    .email("Email inválido")
    .max(100, "Máximo 100 caracteres"),
});

// Schema para cambiar contraseña (opcional)
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// === UPDATE PROFILE ===
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const userId = session.user.id;

  const validated = updateProfileSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
  });

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const { username, email } = validated.data;

  try {
    // Verificar que username/email no estén tomados por otro usuario
    const existing = await prisma.usuario.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          { OR: [{ email }, { username }] },
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        error:
          existing.email === email
            ? "Ese email ya está en uso por otra cuenta"
            : "Ese nombre de usuario ya está en uso",
      };
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { username, email },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return { success: false, error: "Error al actualizar el perfil" };
  }
}

// === CHANGE PASSWORD ===
export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const userId = session.user.id;

  const validated = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    const firstError = validated.error.errors[0]?.message || "Datos inválidos";
    return { success: false, error: firstError };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Verificar contraseña actual
    const match = await bcrypt.compare(validated.data.currentPassword, usuario.password);
    if (!match) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 10);

    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return { success: false, error: "Error al cambiar la contraseña" };
  }
}

// === DELETE ACCOUNT ===
export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const userId = session.user.id;
  const password = formData.get("password") as string;

  if (!password) {
    return { success: false, error: "Ingresa tu contraseña para confirmar" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Verificar contraseña antes de eliminar
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return { success: false, error: "Contraseña incorrecta" };
    }

    // Eliminar usuario (cascade borra reseñas y listas)
    await prisma.usuario.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return { success: false, error: "Error al eliminar la cuenta" };
  }
}

// === GET PROFILE DATA ===
export async function getProfile(userId: string) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          resenas: true,
          listasJuegos: true,
        },
      },
    },
  });
}
