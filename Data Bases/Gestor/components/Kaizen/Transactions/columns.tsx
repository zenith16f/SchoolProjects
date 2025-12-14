"use client";
import { getCategoryIcon, IconName } from "@/libs/data/Icons/icons";
import { OperacionRelaciones } from "@/libs/interfaces/AppInterfaces";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<OperacionRelaciones>[] = [
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {getCategoryIcon(row.original.categoria.icono as IconName)}
          </div>
          <span className="font-medium text-gray-900">
            {row.getValue("descripcion")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "cuenta",
    header: "Cuenta",
    cell: ({ row }) => {
      return (
        <span className="text-gray-600">{row.original.cuenta.nombre}</span>
      );
    },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => {
      const fecha = new Date(row.getValue("fecha"));
      return (
        <span className="text-gray-400 text-sm">
          {fecha.toLocaleDateString("es-MX")}
        </span>
      );
    },
  },
  {
    accessorKey: "monto",
    header: () => <div className="text-right">Monto</div>,
    cell: ({ row }) => {
      const monto = row.getValue("monto") as number;
      const tipo = row.original.categoria.tipo;
      const sign = tipo === "ingreso" ? "+" : "-";
      const colorClass =
        tipo === "ingreso" ? "text-salvia-green" : "text-spectrum-red";

      return (
        <div className={`text-right font-semibold ${colorClass}`}>
          {sign}$
          {monto.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
];
