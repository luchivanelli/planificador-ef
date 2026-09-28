-- Dos índices de lectura. No cambian ningún dato ni ninguna forma de tabla:
-- sólo le dan a Postgres un camino directo para dos consultas que hoy recorren
-- de más.

-- El informe del período pide la asistencia de un curso entre dos fechas.
-- La clave única `(cursoId, alumnoId, fecha, claseDiariaId)` empieza por
-- `cursoId`, pero tiene `alumnoId` en el medio: el rango de fechas no la puede
-- aprovechar y termina recorriendo toda la asistencia del curso.
CREATE INDEX "Asistencia_cursoId_fecha_idx" ON "Asistencia"("cursoId", "fecha");

-- "Las clases de hoy" del panel y el informe del período filtran por fecha
-- sola. El índice `(estado, fecha)` no les sirve: un índice compuesto sólo se
-- puede usar desde su primera columna, y esas consultas no filtran por estado.
CREATE INDEX "ClaseDiaria_fecha_idx" ON "ClaseDiaria"("fecha");
