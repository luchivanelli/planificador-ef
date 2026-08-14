-- Drop existing unique constraint for attendance records
ALTER TABLE "Asistencia" DROP CONSTRAINT IF EXISTS "Asistencia_cursoId_alumnoId_fecha_key";

-- Add new unique constraint scoped by class
CREATE UNIQUE INDEX "Asistencia_cursoId_alumnoId_fecha_claseDiariaId_key"
ON "Asistencia" ("cursoId", "alumnoId", "fecha", "claseDiariaId");

-- Ensure class-specific index exists
CREATE INDEX IF NOT EXISTS "Asistencia_claseDiariaId_idx"
ON "Asistencia" ("claseDiariaId");
