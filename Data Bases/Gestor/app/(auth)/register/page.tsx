"use client";
import PasswordInput from "@/components/Kaizen/small/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/libs/actions/auth";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const Register = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await register(formData);

      if (result.success) {
        toast.success("Cuenta creada exitosamente", {
          description: "Ahora puedes iniciar sesión",
        });

        // Redirigir al login después de un momento
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (result.errors) {
        // Mostrar errores de validación
        Object.entries(result.errors).forEach(([field, messages]) => {
          messages?.forEach((message) => {
            toast.error(message);
          });
        });
      } else {
        toast.error(result.error || "Error al crear la cuenta");
      }
    });
  };

  return (
    <main className="flex justify-center items-center content-center w-lvw h-lvh">
      <div className="content-center border-2 rounded-xl p-6 m-6 shadow">
        <section className="items-center content-center w-md mx-10">
          <section className="inline-flex items-center my-3.5">
            <Link
              href="/"
              className="flex p-2 items-center content-center"
            >
              <ArrowLeft />
            </Link>
          </section>
          <section className="flex flex-col content-center items-center mb-6 gap-4">
            <Image
              src="/Logo.svg"
              alt="Logo"
              loading="eager"
              width={100}
              height={100}
            />
            <span className="font-semibold text-2xl">Káizen</span>
          </section>
          <section className="w-full">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="usernameInput"
                  className="flex gap-2.5"
                >
                  <User />
                  Nombre de usuario
                </label>
                <Input
                  id="usernameInput"
                  name="username"
                  type="text"
                  placeholder="Nombre de Usuario"
                  required
                  disabled={isPending}
                />
              </section>
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="emailInput"
                  className="flex gap-2.5"
                >
                  <Mail />
                  Correo
                </label>
                <Input
                  id="emailInput"
                  name="email"
                  type="email"
                  placeholder="Correo"
                  required
                  disabled={isPending}
                />
              </section>
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="passwordInput"
                  className="flex gap-2.5"
                >
                  <Lock />
                  Contraseña
                </label>
                <PasswordInput
                  id="passwordInput"
                  name="password"
                  placeholder="Contraseña"
                  required
                  disabled={isPending}
                />
              </section>
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="confirmInput"
                  className="flex gap-2.5"
                >
                  <Lock />
                  Confirmar contraseña
                </label>
                <PasswordInput
                  id="confirmInput"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  required
                  disabled={isPending}
                />
              </section>
              <section className="flex justify-center mt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer w-full"
                >
                  {isPending ? "Registrando..." : "Registrarse"}
                </Button>
              </section>
            </form>
          </section>
          <section className="text-deep-blue flex justify-center mt-4">
            <Link href={"/login"}>¿Ya tienes cuenta? Iniciar Sesión</Link>
          </section>
        </section>
      </div>
    </main>
  );
};

export default Register;
