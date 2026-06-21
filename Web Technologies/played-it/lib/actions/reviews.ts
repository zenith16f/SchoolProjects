"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schema de validación
const reviewSchema = z.object({
  rawgGameId: z.number().int().positive(),
  gameName: z.string().min(1).max(200),
  gameImage: z.string().max(500).nullable(),
  rating: z.number().int().min(1).max(5),
  contenido: z.string().min(10, "La reseña debe tener al menos 10 caracteres").max(5000, "Máximo 5000 caracteres"),
});

type ReviewResult = {
  success: boolean;
  error?: string;
};

// === CREATE ===
export async function createReview(formData: FormData): Promise<ReviewResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión para escribir una reseña" };
  }

  const userId = session.user.id;

  const validated = reviewSchema.safeParse({
    rawgGameId: Number(formData.get("rawgGameId")),
    gameName: formData.get("gameName"),
    gameImage: formData.get("gameImage") || null,
    rating: Number(formData.get("rating")),
    contenido: formData.get("contenido"),
  });

  if (!validated.success) {
    const firstError = validated.error.errors[0]?.message || "Datos inválidos";
    return { success: false, error: firstError };
  }

  try {
    // Verificar si ya tiene una reseña para este juego
    const existing = await prisma.resena.findUnique({
      where: {
        userId_rawgGameId: {
          userId,
          rawgGameId: validated.data.rawgGameId,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Ya escribiste una reseña para este juego. Puedes editarla." };
    }

    await prisma.resena.create({
      data: {
        userId,
        rawgGameId: validated.data.rawgGameId,
        gameName: validated.data.gameName,
        gameImage: validated.data.gameImage,
        rating: validated.data.rating,
        contenido: validated.data.contenido,
      },
    });

    revalidatePath(`/game/${validated.data.rawgGameId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al crear reseña:", error);
    return { success: false, error: "Error al guardar la reseña" };
  }
}

// === READ ===
export async function getReviewsByGame(rawgGameId: number) {
  try {
    const reviews = await prisma.resena.findMany({
      where: { rawgGameId },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    return [];
  }
}

// Tipo de una reseña con datos del usuario
export type ReviewWithUser = Awaited<ReturnType<typeof getReviewsByGame>>[number];

// === UPDATE ===
export async function updateReview(formData: FormData): Promise<ReviewResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const userId = session.user.id;
  const reviewId = formData.get("reviewId") as string;
  const rating = Number(formData.get("rating"));
  const contenido = formData.get("contenido") as string;

  if (!reviewId || !rating || !contenido) {
    return { success: false, error: "Datos incompletos" };
  }

  if (rating < 1 || rating > 5) {
    return { success: false, error: "La calificación debe ser entre 1 y 5" };
  }

  if (contenido.length < 10) {
    return { success: false, error: "La reseña debe tener al menos 10 caracteres" };
  }

  try {
    // Verificar que la reseña pertenece al usuario
    const review = await prisma.resena.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: "Reseña no encontrada" };
    }

    if (review.userId !== userId) {
      return { success: false, error: "No puedes editar una reseña que no es tuya" };
    }

    await prisma.resena.update({
      where: { id: reviewId },
      data: { rating, contenido },
    });

    revalidatePath(`/game/${review.rawgGameId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar reseña:", error);
    return { success: false, error: "Error al actualizar la reseña" };
  }
}

// === DELETE ===
export async function deleteReview(formData: FormData): Promise<ReviewResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión" };
  }

  const userId = session.user.id;
  const reviewId = formData.get("reviewId") as string;

  if (!reviewId) {
    return { success: false, error: "ID de reseña inválido" };
  }

  try {
    const review = await prisma.resena.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: "Reseña no encontrada" };
    }

    if (review.userId !== userId) {
      return { success: false, error: "No puedes eliminar una reseña que no es tuya" };
    }

    await prisma.resena.delete({
      where: { id: reviewId },
    });

    revalidatePath(`/game/${review.rawgGameId}`);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar reseña:", error);
    return { success: false, error: "Error al eliminar la reseña" };
  }
}
