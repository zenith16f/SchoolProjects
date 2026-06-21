"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

// Schema de validación para registro
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(50, "Máximo 50 caracteres")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Solo letras, números y guion bajo"
      ),
    email: z
      .string()
      .email("Email inválido")
      .max(100, "Máximo 100 caracteres"),
    password: z
      .string()
      .min(6, "Mínimo 6 caracteres")
      .max(100, "Máximo 100 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Tipo de respuesta para las acciones
type AuthResult = {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
};

// === REGISTRO ===
export async function register(formData: FormData): Promise<AuthResult> {
  // Validar datos con zod
  const validated = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { username, email, password } = validated.data;

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return {
        success: false,
        error:
          existingUser.email === email
            ? "El email ya está registrado"
            : "El nombre de usuario ya existe",
      };
    }

    // Hashear la contraseña con bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en la base de datos
    await prisma.usuario.create({
      data: {
        username,
        email,
        password: hashedPassword,
        activo: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en registro:", error);
    return { success: false, error: "Error al crear el usuario" };
  }
}
