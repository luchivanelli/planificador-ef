-- El campo pasó de ser sólo médico a ser el seguimiento general del alumno.
-- Se renombra en vez de recrear la columna para no perder lo ya cargado.
ALTER TABLE "Alumno" RENAME COLUMN "observacionesMedicas" TO "observaciones";
