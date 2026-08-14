/*
  Warnings:

  - You are about to drop the `_EjeNapToPlanificacion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `estrategia` to the `Juego` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstrategiaJuego" AS ENUM ('mando_directo', 'asignacion_de_tareas', 'ensenianza_reciproca', 'descubrimiento_guiado', 'resolucion_de_problemas');

-- DropForeignKey
ALTER TABLE "_EjeNapToPlanificacion" DROP CONSTRAINT "_EjeNapToPlanificacion_A_fkey";

-- DropForeignKey
ALTER TABLE "_EjeNapToPlanificacion" DROP CONSTRAINT "_EjeNapToPlanificacion_B_fkey";

-- AlterTable
ALTER TABLE "ClaseDiaria" ADD COLUMN     "ejeNapId" TEXT;

-- AlterTable
ALTER TABLE "Juego" ADD COLUMN     "estrategia" "EstrategiaJuego" NOT NULL;

-- DropTable
DROP TABLE "_EjeNapToPlanificacion";

-- CreateIndex
CREATE INDEX "Juego_estrategia_idx" ON "Juego"("estrategia");

-- AddForeignKey
ALTER TABLE "ClaseDiaria" ADD CONSTRAINT "ClaseDiaria_ejeNapId_fkey" FOREIGN KEY ("ejeNapId") REFERENCES "EjeNap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
