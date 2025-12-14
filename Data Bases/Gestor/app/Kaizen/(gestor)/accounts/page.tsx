// app/Kaizen/accounts/page.tsx
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AccountCard from "@/components/Kaizen/Accounts/AccountCard";
import { AddAccount } from "@/components/Kaizen/Dialog/Add/Add";
import Title from "@/components/Kaizen/small/Title";
import { fetchAccounts } from "@/libs/data/accounts";
// import { auth } from "@/libs/auth";
import { Wallet } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const Accounts = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Usar el ID del usuario
  const idUsuario = parseInt(session?.user.id);
  const data = await fetchAccounts(idUsuario);

  const cuentasActivas = data.filter((cuenta) => cuenta.activa);

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="flex flex-row gap-32">
        <Title
          icon={Wallet}
          title="Cuentas"
          description="Gestiona todas tus billeteras y cuentas"
        />
        <AddAccount idUsuario={idUsuario} />
      </div>

      {cuentasActivas.length > 0 ? (
        <div className="flex flex-col gap-6">
          {cuentasActivas.map((cuenta) => (
            <AccountCard
              key={cuenta.idCuenta}
              id={cuenta.idCuenta}
              name={cuenta.nombre}
              type={cuenta.tipo}
              money={Number(cuenta.saldoActual)}
              active={cuenta.activa}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Wallet className="w-12 h-12 text-gray-400" />
            <p className="text-gray-500">No tienes cuentas activas</p>
            <p className="text-sm text-gray-400">
              Crea tu primera cuenta para comenzar a gestionar tus finanzas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
