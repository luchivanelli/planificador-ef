/*
  Warnings:

  - You are about to drop the column `fechaFin` on the `Planificacion` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `Planificacion` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `Planificacion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Planificacion" DROP COLUMN "fechaFin",
DROP COLUMN "fechaInicio",
DROP COLUMN "titulo";
