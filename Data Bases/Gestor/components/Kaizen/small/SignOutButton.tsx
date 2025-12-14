"use client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false }); // No redirigir automáticamente
      toast.success("Sesión cerrada exitosamente");
      router.push("/"); // Redirigir manualmente
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };
  return (
    <Button
      variant="ghost"
      className="w-full justify-start cursor-pointer hover:bg-stone-200"
      onClick={handleSignOut}
    >
      <LogOut />
      <span>Cerrar Sesión</span>
    </Button>
  );
};

export default SignOutButton;
