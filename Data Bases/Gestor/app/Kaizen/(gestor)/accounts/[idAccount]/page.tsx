import { AccountDetailCard } from "@/components/Kaizen/Accounts/AccoundDetails";
import { DeleteAccount } from "@/components/Kaizen/Dialog/Delete";
import { EditAccount } from "@/components/Kaizen/Dialog/Edit/Edit";
import BackToLink from "@/components/Kaizen/small/BackToLink";
import Title from "@/components/Kaizen/small/Title";
import { fetchAccount } from "@/libs/data/accounts";
import { ArrowLeft, Wallet } from "lucide-react";

const Account = async ({
  params,
}: {
  params: Promise<{ idAccount: string }>;
}) => {
  const { idAccount } = await params;

  const idAccountNumber = parseInt(idAccount, 10);

  if (isNaN(idAccountNumber)) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>ID de cuenta inválido</p>
      </div>
    );
  }

  const account = await fetchAccount(idAccountNumber);

  if (!account) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>Cuenta no encontrada</p>
      </div>
    );
  }

  // Preparar datos para EditAccount
  const cuentaData = {
    idCuenta: account.idCuenta,
    nombre: account.nombre,
    tipo: account.tipo,
    saldoActual: Number(account.saldoActual),
    moneda: account.moneda,
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <section className="mb-4">
          <BackToLink
            icon={ArrowLeft}
            title="Cuentas"
            url={`Kaizen/accounts`}
          />
        </section>
        <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <section>
            <Title
              icon={Wallet}
              title="Detalles de la Cuenta"
              description={`ID: ACC-${String(account.idCuenta).padStart(
                3,
                "0"
              )}`}
            />
          </section>
          <section>
            <div className="flex gap-3">
              <EditAccount cuenta={cuentaData} />
              <DeleteAccount
                idCuenta={account.idCuenta}
                nombreCuenta={account.nombre}
              />
            </div>
          </section>
        </section>
      </div>

      <AccountDetailCard
        nombre={account.nombre}
        tipo={account.tipo}
        saldoInicial={Number(account.saldoInicial)}
        saldoActual={Number(account.saldoActual)}
        moneda={account.moneda}
        fechaCreacion={account.fechaCreacion}
        activa={account.activa}
      />
    </div>
  );
};

export default Account;
