-- El índice único de `dni` se va junto con la columna.
-- AlterTable
ALTER TABLE "Alumno" DROP COLUMN "dni",
DROP COLUMN "fechaNacimiento";
