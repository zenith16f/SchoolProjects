"use client";

import { useState, useTransition } from "react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { deleteReview } from "@/lib/actions/reviews";
import type { ReviewWithUser } from "@/lib/actions/reviews";

interface ReviewCardProps {
  review: ReviewWithUser;
  currentUserId?: string;
  rawgGameId: number;
  gameName: string;
  gameImage: string | null;
}

export default function ReviewCard({
  review,
  currentUserId,
  rawgGameId,
  gameName,
  gameImage,
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentUserId === review.usuario.id;

  // Formatear fecha
  const fecha = new Date(review.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const wasEdited =
    new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 1000;

  // Si está en modo edición, mostrar el form
  if (isEditing) {
    return (
      <ReviewForm
        rawgGameId={rawgGameId}
        gameName={gameName}
        gameImage={gameImage}
        editData={{
          reviewId: review.id,
          rating: review.rating,
          contenido: review.contenido,
        }}
        onDone={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const handleDelete = () => {
    const formData = new FormData();
    formData.set("reviewId", String(review.id));

    startTransition(async () => {
      await deleteReview(formData);
      setShowConfirmDelete(false);
    });
  };

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5">
      {/* Header: avatar + username + fecha + estrellas */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-display font-semibold">
              {review.usuario.username.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">
                {review.usuario.username}
              </span>
              <StarRating value={review.rating} readonly size="sm" />
            </div>
            <span className="text-muted text-xs">
              {fecha}
              {wasEdited && " · editado"}
            </span>
          </div>
        </div>

        {/* Acciones del dueño */}
        {isOwner && !showConfirmDelete && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="text-muted hover:text-white text-xs px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-muted hover:text-red-400 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Confirmación de eliminación */}
      {showConfirmDelete && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 mb-3 flex items-center justify-between">
          <p className="text-red-400 text-xs">
            ¿Eliminar esta reseña? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 ml-3">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "..." : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="text-xs text-muted hover:text-white px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Contenido de la reseña */}
      <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
        {review.contenido}
      </p>
    </div>
  );
}
