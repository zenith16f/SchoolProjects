"use client";

import { useState, useTransition } from "react";
import StarRating from "./StarRating";
import { createReview, updateReview } from "@/lib/actions/reviews";

interface ReviewFormProps {
  rawgGameId: number;
  gameName: string;
  gameImage: string | null;
  // Si se pasa, es modo edición
  editData?: {
    reviewId: string;
    rating: number;
    contenido: string;
  };
  onDone?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  rawgGameId,
  gameName,
  gameImage,
  editData,
  onDone,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(editData?.rating ?? 0);
  const [contenido, setContenido] = useState(editData?.contenido ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEditing = !!editData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Selecciona una calificación");
      return;
    }
    if (contenido.trim().length < 10) {
      setError("La reseña debe tener al menos 10 caracteres");
      return;
    }

    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("contenido", contenido.trim());

    if (isEditing) {
      formData.set("reviewId", String(editData.reviewId));
    } else {
      formData.set("rawgGameId", String(rawgGameId));
      formData.set("gameName", gameName);
      formData.set("gameImage", gameImage ?? "");
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateReview(formData)
        : await createReview(formData);

      if (result.success) {
        if (!isEditing) {
          setRating(0);
          setContenido("");
        }
        onDone?.();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  };

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-6">
      <h3 className="font-display font-semibold text-base text-white mb-4">
        {isEditing ? "Editar reseña" : "Escribe tu reseña"}
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Calificación con estrellas */}
        <div>
          <label className="text-sm text-muted font-medium block mb-2">
            Tu calificación
          </label>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <span className="text-accent font-display font-semibold text-sm">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Texto de la reseña */}
        <div>
          <label
            htmlFor="contenido"
            className="text-sm text-muted font-medium block mb-2"
          >
            Tu opinión
          </label>
          <textarea
            id="contenido"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="¿Qué te pareció este juego? Comparte tu experiencia..."
            rows={4}
            maxLength={5000}
            disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-3 transition-all focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 disabled:opacity-50 resize-none"
          />
          <p className="text-muted/50 text-xs mt-1 text-right">
            {contenido.length}/5000
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Botones */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending
              ? isEditing
                ? "Guardando..."
                : "Publicando..."
              : isEditing
                ? "Guardar cambios"
                : "Publicar reseña"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-muted hover:text-white text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
