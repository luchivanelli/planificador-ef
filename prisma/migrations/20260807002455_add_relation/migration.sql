/*
  Warnings:

  - You are about to drop the column `duracionEstimada` on the `Juego` table. All the data in the column will be lost.
  - You are about to drop the column `visibilidad` on the `Juego` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClaseDiaria" ADD COLUMN     "contenidosClase" TEXT,
ADD COLUMN     "temaClase" TEXT;

-- AlterTable
ALTER TABLE "Juego" DROP COLUMN "duracionEstimada",
DROP COLUMN "visibilidad";

-- DropEnum
DROP TYPE "Visibilidad";

-- CreateTable
CREATE TABLE "Indicadores" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "claseDiariaID" TEXT NOT NULL,

    CONSTRAINT "Indicadores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Indicadores" ADD CONSTRAINT "Indicadores_claseDiariaID_fkey" FOREIGN KEY ("claseDiariaID") REFERENCES "ClaseDiaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
