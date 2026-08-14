/*
  Warnings:

  - You are about to drop the column `planificacionId` on the `ClaseDiaria` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cursoId,anio]` on the table `Planificacion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unidadDidacticaId` to the `ClaseDiaria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `anio` to the `Planificacion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClaseDiaria" DROP CONSTRAINT "ClaseDiaria_planificacionId_fkey";

-- DropIndex
DROP INDEX "ClaseDiaria_planificacionId_idx";

-- AlterTable
ALTER TABLE "ClaseDiaria" DROP COLUMN "planificacionId",
ADD COLUMN     "unidadDidacticaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Planificacion" ADD COLUMN     "anio" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "UnidadDidactica" (
    "id" TEXT NOT NULL,
    "planificacionId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivo" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnidadDidactica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnidadDidactica_planificacionId_idx" ON "UnidadDidactica"("planificacionId");

-- CreateIndex
CREATE INDEX "ClaseDiaria_unidadDidacticaId_idx" ON "ClaseDiaria"("unidadDidacticaId");

-- CreateIndex
CREATE UNIQUE INDEX "Planificacion_cursoId_anio_key" ON "Planificacion"("cursoId", "anio");

-- AddForeignKey
ALTER TABLE "UnidadDidactica" ADD CONSTRAINT "UnidadDidactica_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseDiaria" ADD CONSTRAINT "ClaseDiaria_unidadDidacticaId_fkey" FOREIGN KEY ("unidadDidacticaId") REFERENCES "UnidadDidactica"("id") ON DELETE CASCADE ON UPDATE CASCADE;
