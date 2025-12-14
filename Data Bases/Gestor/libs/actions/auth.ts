"use server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validación para registro
const registerSchema = z
  .object({
    username: z.string().min(3, "Mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// Categorías base que se crearán al registrar un usuario
const CATEGORIAS_BASE = [
  // INGRESOS
  {
    nombre: "Salario",
    tipo: "ingreso",
    descripcion: "Ingresos por salario mensual",
    icono: "briefcase",
    color: "#10B981",
  },
  {
    nombre: "Freelance",
    tipo: "ingreso",
    descripcion: "Trabajos independientes",
    icono: "trending_up",
    color: "#3B82F6",
  },
  {
    nombre: "Inversiones",
    tipo: "ingreso",
    descripcion: "Rendimientos de inversiones",
    icono: "piggy_bank",
    color: "#8B5CF6",
  },
  {
    nombre: "Otros Ingresos",
    tipo: "ingreso",
    descripcion: "Ingresos adicionales",
    icono: "dollar",
    color: "#6B7280",
  },

  // EGRESOS
  {
    nombre: "Alimentación",
    tipo: "egreso",
    descripcion: "Supermercado, restaurantes y compras de comida",
    icono: "shopping_cart",
    color: "#EF4444",
  },
  {
    nombre: "Transporte",
    tipo: "egreso",
    descripcion: "Gasolina, transporte público y viajes",
    icono: "car",
    color: "#F59E0B",
  },
  {
    nombre: "Vivienda",
    tipo: "egreso",
    descripcion: "Renta, servicios y mantenimiento del hogar",
    icono: "home",
    color: "#14B8A6",
  },
  {
    nombre: "Entretenimiento",
    tipo: "egreso",
    descripcion: "Salidas, streaming y ocio",
    icono: "gamepad",
    color: "#EC4899",
  },
  {
    nombre: "Salud",
    tipo: "egreso",
    descripcion: "Medicamentos, consultas y gym",
    icono: "heart",
    color: "#EF4444",
  },
  {
    nombre: "Educación",
    tipo: "egreso",
    descripcion: "Cursos, libros y capacitación",
    icono: "book",
    color: "#3B82F6",
  },
  {
    nombre: "Servicios",
    tipo: "egreso",
    descripcion: "Luz, agua, internet y telefonía",
    icono: "zap",
    color: "#F59E0B",
  },
  {
    nombre: "Compras",
    tipo: "egreso",
    descripcion: "Ropa, tecnología y otros",
    icono: "shopping_bag",
    color: "#8B5CF6",
  },
];

export async function register(formData: FormData) {
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

    // Hash de la contraseña (A futuri)
    //const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario y categorías base en una transacción
    await prisma.$transaction(async (tx) => {
      // Crear usuario
      const nuevoUsuario = await tx.usuario.create({
        data: {
          username,
          email,
          password: password, // Despues pasar hashedPassword
          activo: true,
        },
      });

      // Crear categorías base
      await tx.categoria.createMany({
        data: CATEGORIAS_BASE.map((cat) => ({
          idUsuario: nuevoUsuario.idUsuario,
          nombre: cat.nombre,
          tipo: cat.tipo as "ingreso" | "egreso",
          descripcion: cat.descripcion,
          icono: cat.icono as any,
          color: cat.color,
          activa: true,
        })),
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error en registro:", error);
    return { success: false, error: "Error al crear el usuario" };
  }
}
