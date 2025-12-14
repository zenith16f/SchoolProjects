import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoryIcon, IconName } from "@/libs/data/Icons/icons";
import { OperacionRelaciones } from "@/libs/interfaces/AppInterfaces";
import Link from "next/link";

interface RecentOperationsTableProps {
  operaciones: OperacionRelaciones[];
}

export function RecentOperationsTable({
  operaciones,
}: RecentOperationsTableProps) {
  const formatMonto = (monto: number, tipo: "ingreso" | "egreso"): string => {
    // Convertir a número por si viene como string
    const montoNumerico = Number(monto);
    const formatted = montoNumerico.toFixed(2);
    const sign = tipo === "ingreso" ? "+" : "-";
    return `${sign}${formatted} $`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Operaciones Recientes
        </h2>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-gray-600 font-medium">
                  Nombre Operación
                </TableHead>
                <TableHead className="text-gray-600 font-medium text-center">
                  Cuenta Utilizada
                </TableHead>
                <TableHead className="text-gray-600 font-medium text-center">
                  Fecha de Operación
                </TableHead>
                <TableHead className="text-gray-600 font-medium text-right">
                  Monto
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operaciones.length > 0 ? (
                operaciones.map((operacion) => (
                  <TableRow
                    key={operacion.idTransaccion}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600">
                          {getCategoryIcon(
                            operacion.categoria.icono as IconName
                          )}
                        </div>
                        <span className="text-gray-900">
                          {operacion.descripcion}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-center">
                      {operacion.cuenta.nombre}
                    </TableCell>
                    <TableCell className="text-gray-500 text-center">
                      {new Date(operacion.fecha).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold font-jetbrains ${
                          operacion.categoria.tipo === "ingreso"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatMonto(operacion.monto, operacion.categoria.tipo)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-gray-500"
                  >
                    No hay operaciones recientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/Kaizen/operations"
            className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            Ver Todas
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
