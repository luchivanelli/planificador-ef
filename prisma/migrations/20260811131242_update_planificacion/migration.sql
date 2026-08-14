/*
  Warnings:

  - A unique constraint covering the columns `[docenteId,cursoId,anio]` on the table `Planificacion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Planificacion_cursoId_anio_key";

-- CreateIndex
CREATE INDEX "Planificacion_docenteId_idx" ON "Planificacion"("docenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Planificacion_docenteId_cursoId_anio_key" ON "Planificacion"("docenteId", "cursoId", "anio");
