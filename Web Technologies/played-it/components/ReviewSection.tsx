"use client";

import { useState } from "react";
import Link from "next/link";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import type { ReviewWithUser } from "@/lib/actions/reviews";

interface ReviewSectionProps {
  reviews: ReviewWithUser[];
  rawgGameId: number;
  gameName: string;
  gameImage: string | null;
  currentUserId?: string; // undefined = no logueado
}

export default function ReviewSection({
  reviews,
  rawgGameId,
  gameName,
  gameImage,
  currentUserId,
}: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const isLoggedIn = !!currentUserId;

  // Verificar si el usuario ya tiene una reseña
  const userReview = isLoggedIn
    ? reviews.find((r) => r.usuario.id === currentUserId)
    : null;

  // Calcular promedio de calificación
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-16 border-t border-border pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-xl text-white">
            Reseñas de la comunidad
          </h2>
          {reviews.length > 0 && (
            <p className="text-muted text-xs mt-1">
              <span className="text-accent font-semibold">
                ★ {avgRating.toFixed(1)}
              </span>{" "}
              promedio · {reviews.length} reseña{reviews.length !== 1 && "s"}
            </p>
          )}
        </div>

        {/* Botón de escribir reseña */}
        {isLoggedIn ? (
          !userReview &&
          !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Escribir reseña
            </button>
          )
        ) : (
          <Link
            href="/login"
            className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
          >
            Inicia sesión para opinar
          </Link>
        )}
      </div>

      {/* Aviso si ya tiene reseña */}
      {userReview && !showForm && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 mb-6">
          <p className="text-accent text-xs font-medium">
            Ya escribiste una reseña para este juego. Puedes editarla o
            eliminarla desde tu comentario.
          </p>
        </div>
      )}

      {/* Formulario de nueva reseña */}
      {showForm && isLoggedIn && (
        <div className="mb-6">
          <ReviewForm
            rawgGameId={rawgGameId}
            gameName={gameName}
            gameImage={gameImage}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Lista de reseñas */}
      {reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              rawgGameId={rawgGameId}
              gameName={gameName}
              gameImage={gameImage}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-surface-2 border border-border rounded-xl p-8 text-center">
            <p className="text-muted text-sm">
              Aún no hay reseñas para este juego. ¡Sé el primero en opinar!
            </p>
          </div>
        )
      )}
    </div>
  );
}
