-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoClase" ADD VALUE 'suspendida';
ALTER TYPE "EstadoClase" ADD VALUE 'reprogramada';

-- CreateIndex
CREATE INDEX "ClaseDiaria_estado_fecha_idx" ON "ClaseDiaria"("estado", "fecha");
