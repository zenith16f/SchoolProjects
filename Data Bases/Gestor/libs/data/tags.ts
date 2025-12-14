import { prisma } from "@/lib/prisma";

export const fetchTags = async (idUsuario: number) => {
  const tags = await prisma.categoria.findMany({
    where: { idUsuario: idUsuario },
  });

  return tags;
};
export const fetchTag = async (idTag: number) => {
  const tag = await prisma.categoria.findUnique({
    where: { idCategoria: idTag }, // Y usar la variable correctamente
  });

  return tag;
};
