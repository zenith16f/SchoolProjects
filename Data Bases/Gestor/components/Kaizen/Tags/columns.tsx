"use client";
import { getCategoryIcon, IconName } from "@/libs/data/Icons/icons";
import { Categoria } from "@/libs/interfaces/AppInterfaces";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Categoria>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre Categoria",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            {row.getValue("nombre")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      return <span className="capitalize">{row.getValue("tipo")}</span>;
    },
  },

  {
    accessorKey: "icono",
    header: "Icono",
    cell: ({ row }) => {
      return (
        <div className="shrink-0">
          {getCategoryIcon(row.original.icono as IconName)}
        </div>
      );
    },
  },
];
