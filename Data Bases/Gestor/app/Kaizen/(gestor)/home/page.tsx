import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RecentOperationsTable } from "@/components/Kaizen/small/RecentTable";
import Title from "@/components/Kaizen/small/Title";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";
import { fetchDashboard } from "@/libs/data/dashboard";
import { getCurrentMonth } from "@/libs/data/date";
import {
  ArrowDown,
  Calendar,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Usar el ID del usuario
  const idUsuario = parseInt(session?.user.id);

  const data = await fetchDashboard(idUsuario);
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario: idUsuario },
  });

  // Obtener mes actual
  const currentMonth = getCurrentMonth();

  // Verificar si hay transacciones en el mes
  const hasTransactions = data.totalIngresos > 0 || data.totalEgresos > 0;

  // Calcular saldo total
  const saldoTotal = data.totalIngresos - data.totalEgresos;

  // Determinar el estado del saldo
  const getSaldoStatus = () => {
    if (saldoTotal > 0) {
      return {
        color: "text-green-600",
        icon: <TrendingUp className="w-5 h-5 text-salvia-green" />,
        bgColor: "bg-green-50",
      };
    } else if (saldoTotal < 0) {
      return {
        color: "text-red-600",
        icon: <TrendingDown className="w-5 h-5 text-spectrum-red" />,
        bgColor: "bg-red-50",
      };
    } else {
      return {
        color: "text-gray-500",
        icon: <Minus className="w-5 h-5 text-gray-500" />,
        bgColor: "bg-gray-50",
      };
    }
  };

  const saldoStatus = getSaldoStatus();

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8">
      <div>
        <Title
          icon={User}
          title={`Bienvenido ${usuario?.username}`}
          description=""
        />
      </div>

      <div className="w-full flex flex-col gap-10 mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Resumen Mensual
          </h1>
          <p className="text-gray-500 text-sm">{currentMonth}</p>
        </div>

        {/* Alerta cuando no hay transacciones */}
        {!hasTransactions && (
          <Alert className="bg-blue-50 border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              No hay transacciones registradas en {currentMonth.toLowerCase()}.
              Comienza a registrar tus ingresos y gastos para ver tu resumen
              financiero.
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Saldo Total */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">
                  Saldo Total
                </h3>
                <div className={`p-2 rounded-lg ${saldoStatus.bgColor}`}>
                  {saldoStatus.icon}
                </div>
              </div>
              {hasTransactions ? (
                <div className="flex items-center gap-2">
                  <p
                    className={`text-3xl font-bold font-jetbrains ${saldoStatus.color}`}
                  >
                    {formatCurrency(saldoTotal)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-3xl font-bold text-gray-300 font-jetbrains">
                    $0.00
                  </p>
                  <p className="text-xs text-gray-400">Sin movimientos</p>
                </div>
              )}
            </div>
          </section>

          {/* Card Ingresos */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Ingresos</h3>
                <div className="p-2 rounded-lg bg-blue-50">
                  <Plus className="w-5 h-5 text-deep-blue" />
                </div>
              </div>
              {hasTransactions ? (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-deep-blue font-jetbrains">
                    {formatCurrency(data.totalIngresos)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-3xl font-bold text-gray-300 font-jetbrains">
                    $0.00
                  </p>
                  <p className="text-xs text-gray-400">Sin ingresos este mes</p>
                </div>
              )}
            </div>
          </section>

          {/* Card Gastos */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Gastos</h3>
                <div className="p-2 rounded-lg bg-red-50">
                  <ArrowDown className="w-5 h-5 text-spectrum-red" />
                </div>
              </div>
              {hasTransactions ? (
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-spectrum-red font-jetbrains">
                    {formatCurrency(data.totalEgresos)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-3xl font-bold text-gray-300 font-jetbrains">
                    $0.00
                  </p>
                  <p className="text-xs text-gray-400">Sin gastos este mes</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Tabla de operaciones recientes */}
        <div>
          <RecentOperationsTable operaciones={data.operacionesRecientes} />
        </div>
      </div>
    </div>
  );
};

export default Home;
