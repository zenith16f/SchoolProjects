import { Badge } from "@/components/ui/badge";
import { getCategoryIcon, IconName } from "@/libs/data/Icons/icons";

interface CategoryDetailCardProps {
  nombre?: string;
  descripcion?: string;
  tipo?: "ingreso" | "egreso";
  icono: IconName;
  color?: string;
}

export function CategoryDetailCard({
  nombre,
  descripcion,
  tipo,
  icono,
  color,
}: CategoryDetailCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-start gap-6">
        <div
          className="shrink-0 rounded-xl p-5 border border-gray-200"
          style={{ backgroundColor: `${color}15` }} // 15 = 15% opacity
        >
          {getCategoryIcon(icono, "w-12 h-12")}
        </div>

        <div className="flex-1">
          <Badge className="mb-3 capitalize">{tipo}</Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{nombre}</h2>
          <p className="text-gray-600 leading-relaxed text-lg">{descripcion}</p>
        </div>
      </div>
    </div>
  );
}
