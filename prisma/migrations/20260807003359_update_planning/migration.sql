/*
  Warnings:

  - You are about to drop the column `tipo` on the `Planificacion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Planificacion" DROP COLUMN "tipo";

-- DropEnum
DROP TYPE "TipoPlanificacion";
