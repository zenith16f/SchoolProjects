"use client";

import PasswordInput from "@/components/Kaizen/small/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const LogIn = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Email o contraseña incorrectos");
        } else {
          toast.success("Inicio de sesión exitoso");
          router.push("/Kaizen/home");
          router.refresh();
        }
      } catch (error) {
        console.error("Error en login:", error);
        toast.error("Error al iniciar sesión");
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

              <section className="flex justify-center mt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full cursor-pointer"
                >
                  {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </section>
            </form>
          </section>
          <section className="flex justify-center mt-4">
            <section className="inline-flex gap-6 text-deep-blue items-center-safe">
              <Link href={"#"}>¿Olvidaste tu contraseña?</Link>
              <Link href={"/register"}>Registrarse</Link>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
};

export default LogIn;
