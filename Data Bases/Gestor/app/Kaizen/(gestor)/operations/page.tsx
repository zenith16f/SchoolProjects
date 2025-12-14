import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { columns } from "@/components/Kaizen/Transactions/columns";
import { OperationsTable } from "@/components/Kaizen/Transactions/data-table";
import Title from "@/components/Kaizen/small/Title";
import { getActiveAccounts } from "@/libs/actions/accounts";
import { getActiveCategories } from "@/libs/actions/tags";
import { fetchOperations } from "@/libs/data/operations";
import { SquareChartGantt } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const Operations = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Usar el ID del usuario
  const idUsuario = parseInt(session?.user.id);

  const data = await fetchOperations(idUsuario); // ← Ya serializado

  const [categorias, cuentas] = await Promise.all([
    getActiveCategories(idUsuario),
    getActiveAccounts(idUsuario),
  ]);

  return (
    <div className="min-h-screen flex flex-col p-4">
      <Title
        icon={SquareChartGantt}
        title="Operaciones"
        description=""
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <OperationsTable
          data={data}
          columns={columns}
          categorias={categorias}
          cuentas={cuentas}
        />
      </div>
    </div>
  );
};

export default Operations;
