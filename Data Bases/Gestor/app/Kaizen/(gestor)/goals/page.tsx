import Title from "@/components/Kaizen/small/Title";
import { Flag } from "lucide-react";

const MetasAhorro = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 ">
      <Title
        icon={Flag}
        title="Metas de Ahorro"
        description="Alcanza tus objetivos financieros paso a paso"
      ></Title>

      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mt-8 flex flex-col items-center justify-center py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            <span className="text-sm font-medium">Próximamente</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Esta funcionalidad estará disponible pronto
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetasAhorro;
