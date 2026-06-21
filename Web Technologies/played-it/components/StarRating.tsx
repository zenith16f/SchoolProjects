"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClass = {
    sm: "text-sm gap-0.5",
    md: "text-xl gap-1",
    lg: "text-2xl gap-1",
  }[size];

  return (
    <div
      className={`inline-flex items-center ${sizeClass}`}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer"
            } ${filled ? "text-accent" : "text-border"}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
