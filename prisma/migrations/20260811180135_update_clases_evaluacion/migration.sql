/*
  Warnings:

  - The values [justificado] on the enum `EstadoAsistencia` will be removed. If these variants are still used in the database, this will fail.
  - The values [vespertino] on the enum `Turno` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cursoId` on the `EvaluacionAlumno` table. All the data in the column will be lost.
  - You are about to drop the column `ejeNapId` on the `EvaluacionAlumno` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `EvaluacionAlumno` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Planificacion` table. All the data in the column will be lost.
  - You are about to drop the column `escala` on the `RubricaCriterio` table. All the data in the column will be lost.
  - You are about to drop the `Espacio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inventario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReservaEspacio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestFisico` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[alumnoId,claseId,rubricaId]` on the table `EvaluacionAlumno` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dni` on table `Alumno` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `claseId` to the `EvaluacionAlumno` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `valor` on the `EvaluacionDetalle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ValorIndicador" AS ENUM ('NO', 'A_VECES', 'SI');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoAsistencia_new" AS ENUM ('presente', 'ausente', 'tarde', 'SAF');
ALTER TABLE "Asistencia" ALTER COLUMN "estado" TYPE "EstadoAsistencia_new" USING ("estado"::text::"EstadoAsistencia_new");
ALTER TYPE "EstadoAsistencia" RENAME TO "EstadoAsistencia_old";
ALTER TYPE "EstadoAsistencia_new" RENAME TO "EstadoAsistencia";
DROP TYPE "public"."EstadoAsistencia_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Turno_new" AS ENUM ('manana', 'tarde');
ALTER TABLE "Curso" ALTER COLUMN "turno" TYPE "Turno_new" USING ("turno"::text::"Turno_new");
ALTER TYPE "Turno" RENAME TO "Turno_old";
ALTER TYPE "Turno_new" RENAME TO "Turno";
DROP TYPE "public"."Turno_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Espacio" DROP CONSTRAINT "Espacio_institucionId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluacionAlumno" DROP CONSTRAINT "EvaluacionAlumno_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluacionAlumno" DROP CONSTRAINT "EvaluacionAlumno_ejeNapId_fkey";

-- DropForeignKey
ALTER TABLE "Inventario" DROP CONSTRAINT "Inventario_institucionId_fkey";

-- DropForeignKey
ALTER TABLE "ReservaEspacio" DROP CONSTRAINT "ReservaEspacio_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "ReservaEspacio" DROP CONSTRAINT "ReservaEspacio_espacioId_fkey";

-- DropForeignKey
ALTER TABLE "TestFisico" DROP CONSTRAINT "TestFisico_alumnoId_fkey";

-- DropIndex
DROP INDEX "EvaluacionAlumno_cursoId_idx";

-- AlterTable
ALTER TABLE "Alumno" ALTER COLUMN "dni" SET NOT NULL;

-- AlterTable
ALTER TABLE "EvaluacionAlumno" DROP COLUMN "cursoId",
DROP COLUMN "ejeNapId",
DROP COLUMN "fecha",
ADD COLUMN     "claseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EvaluacionDetalle" DROP COLUMN "valor",
ADD COLUMN     "valor" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Planificacion" DROP COLUMN "estado";

-- AlterTable
ALTER TABLE "RubricaCriterio" DROP COLUMN "escala";

-- DropTable
DROP TABLE "Espacio";

-- DropTable
DROP TABLE "Inventario";

-- DropTable
DROP TABLE "ReservaEspacio";

-- DropTable
DROP TABLE "TestFisico";

-- DropEnum
DROP TYPE "EscalaCriterio";

-- DropEnum
DROP TYPE "EstadoInventario";

-- DropEnum
DROP TYPE "EstadoPlanificacion";

-- DropEnum
DROP TYPE "TipoTest";

-- CreateTable
CREATE TABLE "EvaluacionIndicador" (
    "id" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "valor" "ValorIndicador" NOT NULL,

    CONSTRAINT "EvaluacionIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicador" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "Indicador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluacionIndicador_claseId_idx" ON "EvaluacionIndicador"("claseId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionIndicador_indicadorId_claseId_key" ON "EvaluacionIndicador"("indicadorId", "claseId");

-- CreateIndex
CREATE INDEX "EvaluacionAlumno_claseId_idx" ON "EvaluacionAlumno"("claseId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionAlumno_alumnoId_claseId_rubricaId_key" ON "EvaluacionAlumno"("alumnoId", "claseId", "rubricaId");

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "ClaseDiaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionIndicador" ADD CONSTRAINT "EvaluacionIndicador_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "Indicador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionIndicador" ADD CONSTRAINT "EvaluacionIndicador_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "ClaseDiaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicador" ADD CONSTRAINT "Indicador_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
