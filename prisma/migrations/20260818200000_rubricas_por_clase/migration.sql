-- La evaluación pasa a tener una sola sección: la rúbrica.
--
-- 1. La rúbrica es de una clase (antes era del docente, por nivel y ciclo).
-- 2. Sus "criterios" pasan a llamarse indicadores y se puntúan del 1 al 10 por
--    alumno, igual que antes.
-- 3. Los indicadores sueltos del docente (`Indicador`) y su evaluación grupal
--    (`EvaluacionIndicador`, escala SI/A_VECES/NO) desaparecen.
--
-- Las rúbricas viejas no cuelgan de ninguna clase y no hay forma de adivinar a
-- cuál asignarlas, así que la sección se rehace desde cero: se pierde lo
-- evaluado hasta ahora.

-- DropTable (indicadores sueltos del docente)
DROP TABLE "EvaluacionIndicador";
DROP TABLE "Indicador";

-- DropEnum
DROP TYPE "ValorIndicador";

-- DropTable (rúbricas del docente)
DROP TABLE "EvaluacionDetalle";
DROP TABLE "EvaluacionAlumno";
DROP TABLE "RubricaCriterio";
DROP TABLE "Rubrica";

-- CreateTable
CREATE TABLE "Rubrica" (
    "id" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaIndicador" (
    "id" TEXT NOT NULL,
    "rubricaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "RubricaIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionAlumno" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "rubricaId" TEXT NOT NULL,
    "observacionDocente" TEXT,

    CONSTRAINT "EvaluacionAlumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionDetalle" (
    "evaluacionId" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "EvaluacionDetalle_pkey" PRIMARY KEY ("evaluacionId","indicadorId")
);

-- CreateIndex
CREATE INDEX "Rubrica_claseId_idx" ON "Rubrica"("claseId");

-- CreateIndex
CREATE INDEX "RubricaIndicador_rubricaId_idx" ON "RubricaIndicador"("rubricaId");

-- CreateIndex
CREATE INDEX "EvaluacionAlumno_alumnoId_idx" ON "EvaluacionAlumno"("alumnoId");

-- CreateIndex
CREATE INDEX "EvaluacionAlumno_claseId_idx" ON "EvaluacionAlumno"("claseId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionAlumno_alumnoId_claseId_rubricaId_key" ON "EvaluacionAlumno"("alumnoId", "claseId", "rubricaId");

-- AddForeignKey
ALTER TABLE "Rubrica" ADD CONSTRAINT "Rubrica_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "ClaseDiaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaIndicador" ADD CONSTRAINT "RubricaIndicador_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "ClaseDiaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionDetalle" ADD CONSTRAINT "EvaluacionDetalle_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "EvaluacionAlumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionDetalle" ADD CONSTRAINT "EvaluacionDetalle_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "RubricaIndicador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
