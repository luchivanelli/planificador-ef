export function buildAsistenciaWhere({
  cursoId,
  alumnoId,
  fecha,
  claseDiariaId,
}: {
  cursoId: string;
  alumnoId: string;
  fecha: Date;
  claseDiariaId?: string | null;
}) {
  return {
    cursoId,
    alumnoId,
    fecha,
    claseDiariaId: claseDiariaId ?? null,
  };
}
