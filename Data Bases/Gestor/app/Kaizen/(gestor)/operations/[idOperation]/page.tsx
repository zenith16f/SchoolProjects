import { DeleteOperation } from "@/components/Kaizen/Dialog/Delete";
import { EditOperation } from "@/components/Kaizen/Dialog/Edit/Edit";
import BackToLink from "@/components/Kaizen/small/BackToLink";
import Title from "@/components/Kaizen/small/Title";
import { getActiveAccounts } from "@/libs/actions/accounts";
import { getCategoryIcon, IconName } from "@/libs/data/Icons/icons";
import { fetchOperation } from "@/libs/data/operations";
// import { auth } from "@/libs/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveCategories } from "@/libs/actions/tags";
import {
  ArrowLeft,
  Calendar,
  SquareChartGantt,
  Tags,
  Wallet,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const Operation = async ({
  params,
}: {
  params: Promise<{ idOperation: string }>;
}) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Usar el ID del usuario
  const idUsuario = parseInt(session?.user.id);

  const { idOperation } = await params;
  const idOperationNumber = parseInt(idOperation, 10);

  if (isNaN(idOperationNumber)) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>ID de operación inválido</p>
      </div>
    );
  }

  // Obtener operación, categorías y cuentas en paralelo
  const [operation, categorias, cuentas] = await Promise.all([
    fetchOperation(idOperationNumber),
    getActiveCategories(idUsuario),
    getActiveAccounts(idUsuario),
  ]);

  if (!operation) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>Operación no encontrada</p>
      </div>
    );
  }

  const sign = operation.categoria.tipo === "ingreso" ? "+" : "-";
  const colorClass =
    operation.categoria.tipo === "ingreso"
      ? "text-salvia-green"
      : "text-spectrum-red";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Preparar datos para EditOperation
  const operacionData = {
    idTransaccion: operation.idTransaccion,
    monto: Number(operation.monto),
    descripcion: operation.descripcion,
    idCategoria: operation.categoria.idCategoria,
    idCuenta: operation.cuenta.idCuenta,
    fecha: new Date(operation.fecha).toISOString().split("T")[0], // YYYY-MM-DD
    notas: operation.notas,
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <section className="mb-4">
          <BackToLink
            icon={ArrowLeft}
            title="Operaciones"
            url={`Kaizen/operations`}
          />
        </section>
        <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <section>
            <Title
              icon={SquareChartGantt}
              title="Detalle de la Operación"
              description={`ID: OPX-${String(operation.idTransaccion).padStart(
                3,
                "0"
              )}`}
            />
          </section>
          <section>
            <div className="flex gap-3">
              <EditOperation
                operacion={operacionData}
                categorias={categorias}
                cuentas={cuentas}
              />
              <DeleteOperation
                idTransaccion={operation.idTransaccion}
                descripcionTransaccion={operation.descripcion}
              />
            </div>
          </section>
        </section>
      </div>

      {/* Resto del contenido de la página... */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8">
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-2 capitalize">
              {operation.categoria.tipo}
            </p>
            <h2
              className={`text-4xl font-bold mb-2 font-jetbrains ${colorClass}`}
            >
              {sign}$
              {Number(operation.monto).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <p className="text-gray-700 text-lg">
              {operation.descripcion || "Sin descripción"}
            </p>
          </div>

          <div className="space-y-5">
            <div className="rounded-lg p-6 border border-black/20">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Fecha</span>
              </div>
              <p className="text-gray-900 font-semibold text-lg">
                {formatDate(operation.fecha)}
              </p>
            </div>

            <div className="rounded-lg p-6 border border-black/20">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">Cuenta</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-semibold text-lg">
                  {operation.cuenta.nombre}
                </p>
                <span className="text-sm text-gray-500 capitalize bg-white px-3 py-1 rounded-full border border-gray-200">
                  {operation.cuenta.tipo}
                </span>
              </div>
            </div>

            <div className="rounded-lg p-6 border border-black/20">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Tags className="w-5 h-5" />
                <span className="text-sm font-medium">Categoría</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${operation.categoria.color}15` }}
                >
                  {getCategoryIcon(
                    operation.categoria.icono as IconName,
                    "w-5 h-5"
                  )}
                </div>
                <p className="text-gray-900 font-semibold text-lg">
                  {operation.categoria.nombre}
                </p>
              </div>
            </div>

            {operation.notas && (
              <div className="rounded-lg p-6 border border-black/20">
                <p className="text-sm font-medium text-gray-600 mb-2">Notas</p>
                <p className="text-gray-700 leading-relaxed">
                  {operation.notas}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Operation;
