/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoJuego" AS ENUM ('jugado', 'jugando', 'por_jugar', 'abandonado', 'favorito');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "avatar" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rawgGameId" INTEGER NOT NULL,
    "gameName" VARCHAR(200) NOT NULL,
    "gameImage" VARCHAR(500),
    "rating" SMALLINT NOT NULL,
    "contenido" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_juegos" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rawgGameId" INTEGER NOT NULL,
    "gameName" VARCHAR(200) NOT NULL,
    "gameImage" VARCHAR(500),
    "estado" "EstadoJuego" NOT NULL DEFAULT 'por_jugar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listas_juegos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_username_idx" ON "usuarios"("username");

-- CreateIndex
CREATE INDEX "resenas_rawgGameId_idx" ON "resenas"("rawgGameId");

-- CreateIndex
CREATE INDEX "resenas_userId_idx" ON "resenas"("userId");

-- CreateIndex
CREATE INDEX "resenas_createdAt_idx" ON "resenas"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "resenas_userId_rawgGameId_key" ON "resenas"("userId", "rawgGameId");

-- CreateIndex
CREATE INDEX "listas_juegos_userId_estado_idx" ON "listas_juegos"("userId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "listas_juegos_userId_rawgGameId_key" ON "listas_juegos"("userId", "rawgGameId");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listas_juegos" ADD CONSTRAINT "listas_juegos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
