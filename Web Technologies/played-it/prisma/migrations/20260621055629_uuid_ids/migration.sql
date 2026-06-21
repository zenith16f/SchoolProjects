/*
  Warnings:

  - The primary key for the `listas_juegos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `resenas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `usuarios` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `listas_juegos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `listas_juegos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `resenas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `resenas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `usuarios` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "listas_juegos" DROP CONSTRAINT "listas_juegos_userId_fkey";

-- DropForeignKey
ALTER TABLE "resenas" DROP CONSTRAINT "resenas_userId_fkey";

-- AlterTable
ALTER TABLE "listas_juegos" DROP CONSTRAINT "listas_juegos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "listas_juegos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "resenas" DROP CONSTRAINT "resenas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "resenas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "listas_juegos_userId_estado_idx" ON "listas_juegos"("userId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "listas_juegos_userId_rawgGameId_key" ON "listas_juegos"("userId", "rawgGameId");

-- CreateIndex
CREATE INDEX "resenas_userId_idx" ON "resenas"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "resenas_userId_rawgGameId_key" ON "resenas"("userId", "rawgGameId");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_juegos" ADD CONSTRAINT "listas_juegos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
