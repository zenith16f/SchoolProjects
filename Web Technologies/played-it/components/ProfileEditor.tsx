"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { updateProfile, changePassword, deleteAccount } from "@/lib/actions/user";

interface ProfileEditorProps {
  username: string;
  email: string;
}

export default function ProfileEditor({ username, email }: ProfileEditorProps) {
  return (
    <div className="flex flex-col gap-6">
      <EditProfileSection username={username} email={email} />
      <ChangePasswordSection />
      <DeleteAccountSection />
    </div>
  );
}

// === EDITAR PERFIL ===
function EditProfileSection({ username, email }: { username: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Perfil actualizado. Los cambios se reflejan al recargar." });
      } else {
        const errorText = result.errors
          ? Object.values(result.errors).flat().join(", ")
          : result.error || "Error desconocido";
        setMessage({ type: "error", text: errorText });
      }
    });
  };

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-6">
      <h2 className="font-display font-semibold text-lg text-white mb-4">
        Editar perfil
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm text-muted font-medium">
            Nombre de usuario
          </label>
          <input
            id="username" name="username" type="text"
            defaultValue={username} required disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-muted font-medium">
            Correo electrónico
          </label>
          <input
            id="email" name="email" type="email"
            defaultValue={email} required disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            message.type === "success"
              ? "text-accent bg-accent/10 border border-accent/20"
              : "text-red-400 bg-red-400/10 border border-red-400/20"
          }`}>
            {message.text}
          </p>
        )}
        <button
          type="submit" disabled={isPending}
          className="self-start bg-accent hover:bg-accent-dim text-surface font-display font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

// === CAMBIAR CONTRASEÑA ===
function ChangePasswordSection() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Contraseña actualizada correctamente." });
        (e.target as HTMLFormElement).reset();
      } else {
        setMessage({ type: "error", text: result.error || "Error desconocido" });
      }
    });
  };

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-6">
      <h2 className="font-display font-semibold text-lg text-white mb-4">
        Cambiar contraseña
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentPassword" className="text-sm text-muted font-medium">
            Contraseña actual
          </label>
          <input
            id="currentPassword" name="currentPassword" type="password"
            placeholder="••••••••" required disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm text-muted font-medium">
            Nueva contraseña
          </label>
          <input
            id="newPassword" name="newPassword" type="password"
            placeholder="Mínimo 6 caracteres" required disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm text-muted font-medium">
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmPassword" name="confirmPassword" type="password"
            placeholder="Repite la nueva contraseña" required disabled={isPending}
            className="w-full bg-surface-3 border border-border text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent disabled:opacity-50"
          />
        </div>
        {message && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            message.type === "success"
              ? "text-accent bg-accent/10 border border-accent/20"
              : "text-red-400 bg-red-400/10 border border-red-400/20"
          }`}>
            {message.text}
          </p>
        )}
        <button
          type="submit" disabled={isPending}
          className="self-start bg-surface-3 hover:bg-border text-white font-display font-semibold text-sm px-6 py-2.5 rounded-lg border border-border disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}

// === ELIMINAR CUENTA ===
function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleDelete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await deleteAccount(formData);
      if (result.success) {
        signOut({ callbackUrl: "/" });
      } else {
        setError(result.error || "Error al eliminar la cuenta");
      }
    });
  };

  return (
    <div className="bg-surface-2 border border-red-400/20 rounded-xl p-6">
      <h2 className="font-display font-semibold text-lg text-white mb-2">
        Zona de peligro
      </h2>
      <p className="text-muted text-sm mb-4">
        Eliminar tu cuenta borrará permanentemente todas tus reseñas, listas y datos. Esta acción no se puede deshacer.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-400/30 font-display font-semibold text-sm px-6 py-2.5 rounded-lg cursor-pointer"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <form onSubmit={handleDelete} className="flex flex-col gap-4 bg-red-400/5 border border-red-400/20 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">
            Para confirmar, ingresa tu contraseña:
          </p>
          <input
            name="password" type="password"
            placeholder="Tu contraseña" required disabled={isPending}
            className="w-full bg-surface-3 border border-red-400/30 text-white placeholder-muted/50 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-400 disabled:opacity-50"
          />
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={isPending}
              className="bg-red-500 hover:bg-red-600 text-white font-display font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Eliminando..." : "Confirmar eliminación"}
            </button>
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setError(""); }}
              className="text-muted hover:text-white text-sm cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
