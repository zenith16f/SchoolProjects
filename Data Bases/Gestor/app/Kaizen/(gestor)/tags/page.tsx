import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Title from "@/components/Kaizen/small/Title";
import { columns } from "@/components/Kaizen/Tags/columns";
import { TagsTable } from "@/components/Kaizen/Tags/data-table";
import { fetchTags } from "@/libs/data/tags";
import { Tags as TagsIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
const Tags = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Usar el ID del usuario
  const idUsuario = parseInt(session?.user.id);
  const Tags = await fetchTags(idUsuario);

  // Filtrar solo categorías activas
  const activeTags = Tags.filter((tag) => tag.activa === true);

  return (
    <div className="min-h-screen flex flex-col p-4">
      <Title
        icon={TagsIcon}
        title="Categorias"
        description=""
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTags.length > 0 ? (
          <TagsTable
            data={activeTags}
            columns={columns}
            idUsuario={idUsuario}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No hay categorías activas
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
