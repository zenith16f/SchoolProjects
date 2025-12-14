import PasswordInput from "@/components/Kaizen/small/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Trash2, User } from "lucide-react";

const ProfileCard = () => {
  return (
    <div className="p-4 m-4">
      <div className={`w-full flex flex-col  gap-8 px-6 py-4 transition-all`}>
        <section>
          <span className="text-2xl font-semibold">Información del Perfil</span>
        </section>

        <section>
          <form className="flex flex-col gap-3 w-full">
            <section className="flex flex-col gap-2">
              <label
                htmlFor="usernameInput"
                className=" font-semibold"
              >
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                  id="usernameInput"
                  type="text"
                  placeholder={`Username`}
                  className="pl-10"
                />
              </div>
            </section>
            <section className="flex flex-col gap-2">
              <label
                htmlFor="emailInput"
                className=" font-semibold"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                <Input
                  id="emailInput"
                  type="email"
                  placeholder={`jhon@doe.com`}
                  className="pl-10"
                />
              </div>
            </section>

            <section className="flex mt-4">
              <Button type="submit">Guardar Cambios</Button>
            </section>
          </form>
        </section>
      </div>
    </div>
  );
};

const SecurityCard = () => {
  return (
    <div className="p-4 m-4">
      <div className={`w-full flex flex-col  gap-4 px-6 py-4 transition-all`}>
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-semibold">Seguridad</span>
          </div>
          <span className="text-gray-600 font-semibold">
            Cambiar Contraseña
          </span>
        </section>

        <section>
          <form className="flex flex-col gap-3 w-full">
            <section className="flex flex-col gap-2">
              <label
                htmlFor="actualInput"
                className=" font-semibold"
              >
                Contraseña Actual
              </label>

              <PasswordInput
                icon={Lock}
                id="actualInput"
              />
            </section>
            <section className="flex flex-col gap-2">
              <label
                htmlFor="newInput"
                className=" font-semibold"
              >
                Nueva Contraseña
              </label>

              <PasswordInput
                icon={Lock}
                id="newInput"
                placeholder="Nueva contraseña"
              />
            </section>
            <section className="flex flex-col gap-2">
              <label
                htmlFor="checkNew"
                className=" font-semibold"
              >
                Confirmar nueva Contraseña
              </label>

              <PasswordInput
                icon={Lock}
                id="checkNew"
                placeholder="Confirmar contraseña"
              />
            </section>

            <section className="flex mt-4">
              <Button type="submit">Actualizar Contraseña</Button>
            </section>
          </form>
        </section>
      </div>
    </div>
  );
};

const DataCard = () => {
  return (
    <div className="p-4 m-4">
      <div className={`w-full flex flex-col  gap-4 px-6 py-4 transition-all`}>
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-semibold">Gestión de Datos</span>
          </div>
        </section>
        <section className="w-full mx-auto p-6 border border-gray-200 rounded-lg bg-white">
          <div className="flex gap-4">
            <div className="shrink-0">
              <Trash2 className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Eliminar Cuenta
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Esta acción es permanente y no se puede deshacer. Todos tus
                datos serán eliminados.
              </p>
              <Button>Eliminar Mi Cuenta</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export { DataCard, ProfileCard, SecurityCard };
