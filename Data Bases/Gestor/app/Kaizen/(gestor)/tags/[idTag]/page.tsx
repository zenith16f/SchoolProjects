import { DeleteTag } from "@/components/Kaizen/Dialog/Delete";
import { EditTag } from "@/components/Kaizen/Dialog/Edit/Edit";
import BackToLink from "@/components/Kaizen/small/BackToLink";
import Title from "@/components/Kaizen/small/Title";
import { CategoryDetailCard } from "@/components/Kaizen/Tags/TagCard";
import { fetchTag } from "@/libs/data/tags";
import { ArrowLeft, Tags } from "lucide-react";

const Tag = async ({ params }: { params: Promise<{ idTag: string }> }) => {
  const { idTag } = await params;

  const idTagNumber = parseInt(idTag, 10);

  if (isNaN(idTagNumber)) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>ID de categoría inválido</p>
      </div>
    );
  }

  const categoria = await fetchTag(idTagNumber);

  if (!categoria) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>Categoría no encontrada</p>
      </div>
    );
  }

  // Preparar datos para EditTag
  const categoriaData = {
    idCategoria: categoria.idCategoria,
    nombre: categoria.nombre,
    tipo: categoria.tipo,
    descripcion: categoria.descripcion,
    icono: categoria.icono,
    color: categoria.color,
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <section className="mb-4">
          <BackToLink
            icon={ArrowLeft}
            title="Categorias"
            url={`Kaizen/tags`}
          />
        </section>
        <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <section>
            <Title
              icon={Tags}
              title="Detalles de la Categoria"
              description={`ID: CAT-${String(categoria.idCategoria).padStart(
                3,
                "0"
              )}`}
            />
          </section>
          <section>
            <div className="flex gap-3">
              <EditTag categoria={categoriaData} />
              <DeleteTag
                idCategoria={categoria.idCategoria}
                nombreCategoria={categoria.nombre}
              />
            </div>
          </section>
        </section>
      </div>
      <CategoryDetailCard
        nombre={categoria.nombre}
        descripcion={categoria.descripcion ?? undefined}
        tipo={categoria.tipo}
        icono={categoria.icono}
        color={categoria.color}
      />
    </div>
  );
};

export default Tag;
