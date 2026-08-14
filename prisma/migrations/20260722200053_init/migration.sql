-- CreateEnum
CREATE TYPE "RolDocente" AS ENUM ('docente', 'admin_institucion', 'directivo');

-- CreateEnum
CREATE TYPE "TipoInstitucion" AS ENUM ('publica', 'privada', 'gestion_social');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('primaria', 'secundaria');

-- CreateEnum
CREATE TYPE "Ciclo" AS ENUM ('primer_ciclo', 'segundo_ciclo', 'septimo_anio', 'ciclo_basico', 'ciclo_orientado');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manana', 'tarde', 'vespertino');

-- CreateEnum
CREATE TYPE "TipoAptoMedico" AS ENUM ('apto_fisico', 'lesion', 'condicion_cronica');

-- CreateEnum
CREATE TYPE "TipoPlanificacion" AS ENUM ('anual', 'trimestral', 'unidad_didactica');

-- CreateEnum
CREATE TYPE "EstadoPlanificacion" AS ENUM ('borrador', 'publicada');

-- CreateEnum
CREATE TYPE "EspacioTipo" AS ENUM ('patio', 'gimnasio', 'cancha_externa');

-- CreateEnum
CREATE TYPE "EstadoClase" AS ENUM ('planificada', 'dictada', 'cancelada');

-- CreateEnum
CREATE TYPE "MotivoCancelacion" AS ENUM ('clima', 'feriado_suspension', 'ausencia_docente', 'otro');

-- CreateEnum
CREATE TYPE "TipoBloque" AS ENUM ('entrada_calor', 'desarrollo', 'vuelta_calma');

-- CreateEnum
CREATE TYPE "RangoEtario" AS ENUM ('de_3_a_5', 'de_6_a_8', 'de_9_a_12', 'de_12_a_15', 'de_15_o_mas');

-- CreateEnum
CREATE TYPE "CategoriaJuego" AS ENUM ('deportivo', 'expresion_corporal', 'cooperativo', 'vida_naturaleza');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('privado', 'institucional', 'publico');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('presente', 'ausente', 'tarde', 'justificado');

-- CreateEnum
CREATE TYPE "EscalaCriterio" AS ENUM ('numerica', 'conceptual');

-- CreateEnum
CREATE TYPE "TipoTest" AS ENUM ('resistencia', 'flexibilidad', 'fuerza', 'velocidad');

-- CreateEnum
CREATE TYPE "TipoInforme" AS ENUM ('individual', 'grupal', 'institucional');

-- CreateEnum
CREATE TYPE "EstadoInventario" AS ENUM ('disponible', 'danado', 'en_reparacion');

-- CreateTable
CREATE TABLE "Docente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "provincia" TEXT,
    "rol" "RolDocente" NOT NULL DEFAULT 'docente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institucion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "tipo" "TipoInstitucion" NOT NULL,

    CONSTRAINT "Institucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocenteInstitucion" (
    "docenteId" TEXT NOT NULL,
    "institucionId" TEXT NOT NULL,
    "rolEnInstitucion" TEXT,

    CONSTRAINT "DocenteInstitucion_pkey" PRIMARY KEY ("docenteId","institucionId")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" TEXT NOT NULL,
    "institucionId" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" "Nivel" NOT NULL,
    "ciclo" "Ciclo" NOT NULL,
    "anioLectivo" INTEGER NOT NULL,
    "turno" "Turno" NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumno" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "contactoEmergencia" TEXT,
    "observacionesMedicas" TEXT,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CursoAlumno" (
    "cursoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBaja" TIMESTAMP(3),

    CONSTRAINT "CursoAlumno_pkey" PRIMARY KEY ("cursoId","alumnoId")
);

-- CreateTable
CREATE TABLE "AptoMedico" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipo" "TipoAptoMedico" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "restricciones" TEXT,
    "adjuntoUrl" TEXT,

    CONSTRAINT "AptoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EjeNap" (
    "id" TEXT NOT NULL,
    "nivel" "Nivel" NOT NULL,
    "ciclo" "Ciclo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "EjeNap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planificacion" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "tipo" "TipoPlanificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "objetivos" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPlanificacion" NOT NULL DEFAULT 'borrador',

    CONSTRAINT "Planificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaseDiaria" (
    "id" TEXT NOT NULL,
    "planificacionId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "objetivoClase" TEXT,
    "espacioRequerido" "EspacioTipo",
    "alternativaClima" TEXT,
    "estado" "EstadoClase" NOT NULL DEFAULT 'planificada',
    "motivoCancelacion" "MotivoCancelacion",
    "motivoCancelacionOtro" TEXT,
    "reprogramadaAId" TEXT,

    CONSTRAINT "ClaseDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaseActividad" (
    "id" TEXT NOT NULL,
    "claseDiariaId" TEXT NOT NULL,
    "juegoId" TEXT,
    "orden" INTEGER NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "duracionRealMinutos" INTEGER,
    "tipoBloque" "TipoBloque" NOT NULL,

    CONSTRAINT "ClaseActividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Juego" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "autorId" TEXT,
    "rangoEtario" "RangoEtario" NOT NULL,
    "categoria" "CategoriaJuego" NOT NULL,
    "ejeNapId" TEXT,
    "jugadoresMin" INTEGER,
    "jugadoresMax" INTEGER,
    "duracionEstimada" INTEGER,
    "espacioRequerido" "EspacioTipo",
    "materiales" TEXT[],
    "materialesAlternativos" TEXT,
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'privado',

    CONSTRAINT "Juego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "claseDiariaId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubrica" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" "Nivel" NOT NULL,
    "ciclo" "Ciclo" NOT NULL,

    CONSTRAINT "Rubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaCriterio" (
    "id" TEXT NOT NULL,
    "rubricaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "escala" "EscalaCriterio" NOT NULL,

    CONSTRAINT "RubricaCriterio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionAlumno" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "rubricaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ejeNapId" TEXT,
    "observacionDocente" TEXT,

    CONSTRAINT "EvaluacionAlumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionDetalle" (
    "evaluacionId" TEXT NOT NULL,
    "criterioId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "EvaluacionDetalle_pkey" PRIMARY KEY ("evaluacionId","criterioId")
);

-- CreateTable
CREATE TABLE "TestFisico" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "tipo" "TipoTest" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,

    CONSTRAINT "TestFisico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL,
    "tipo" "TipoInforme" NOT NULL,
    "cursoId" TEXT,
    "alumnoId" TEXT,
    "periodo" TEXT NOT NULL,
    "contenidoJson" JSONB,
    "pdfUrl" TEXT,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Informe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espacio" (
    "id" TEXT NOT NULL,
    "institucionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "EspacioTipo" NOT NULL,
    "capacidad" INTEGER,

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaEspacio" (
    "id" TEXT NOT NULL,
    "espacioId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservaEspacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "institucionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoInventario" NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EjeNapToPlanificacion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EjeNapToPlanificacion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Docente_email_key" ON "Docente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_token_key" ON "Sesion"("token");

-- CreateIndex
CREATE INDEX "Sesion_docenteId_idx" ON "Sesion"("docenteId");

-- CreateIndex
CREATE INDEX "Curso_docenteId_idx" ON "Curso"("docenteId");

-- CreateIndex
CREATE INDEX "Curso_institucionId_idx" ON "Curso"("institucionId");

-- CreateIndex
CREATE UNIQUE INDEX "Alumno_dni_key" ON "Alumno"("dni");

-- CreateIndex
CREATE INDEX "AptoMedico_alumnoId_idx" ON "AptoMedico"("alumnoId");

-- CreateIndex
CREATE INDEX "Planificacion_cursoId_idx" ON "Planificacion"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaseDiaria_reprogramadaAId_key" ON "ClaseDiaria"("reprogramadaAId");

-- CreateIndex
CREATE INDEX "ClaseDiaria_planificacionId_idx" ON "ClaseDiaria"("planificacionId");

-- CreateIndex
CREATE INDEX "ClaseActividad_claseDiariaId_idx" ON "ClaseActividad"("claseDiariaId");

-- CreateIndex
CREATE INDEX "Juego_rangoEtario_idx" ON "Juego"("rangoEtario");

-- CreateIndex
CREATE INDEX "Juego_categoria_idx" ON "Juego"("categoria");

-- CreateIndex
CREATE INDEX "Asistencia_alumnoId_idx" ON "Asistencia"("alumnoId");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_cursoId_alumnoId_fecha_key" ON "Asistencia"("cursoId", "alumnoId", "fecha");

-- CreateIndex
CREATE INDEX "EvaluacionAlumno_alumnoId_idx" ON "EvaluacionAlumno"("alumnoId");

-- CreateIndex
CREATE INDEX "EvaluacionAlumno_cursoId_idx" ON "EvaluacionAlumno"("cursoId");

-- CreateIndex
CREATE INDEX "TestFisico_alumnoId_idx" ON "TestFisico"("alumnoId");

-- CreateIndex
CREATE INDEX "ReservaEspacio_espacioId_fecha_idx" ON "ReservaEspacio"("espacioId", "fecha");

-- CreateIndex
CREATE INDEX "_EjeNapToPlanificacion_B_index" ON "_EjeNapToPlanificacion"("B");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteInstitucion" ADD CONSTRAINT "DocenteInstitucion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteInstitucion" ADD CONSTRAINT "DocenteInstitucion_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "Institucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "Institucion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAlumno" ADD CONSTRAINT "CursoAlumno_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoAlumno" ADD CONSTRAINT "CursoAlumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptoMedico" ADD CONSTRAINT "AptoMedico_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planificacion" ADD CONSTRAINT "Planificacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planificacion" ADD CONSTRAINT "Planificacion_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseDiaria" ADD CONSTRAINT "ClaseDiaria_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseDiaria" ADD CONSTRAINT "ClaseDiaria_reprogramadaAId_fkey" FOREIGN KEY ("reprogramadaAId") REFERENCES "ClaseDiaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseActividad" ADD CONSTRAINT "ClaseActividad_claseDiariaId_fkey" FOREIGN KEY ("claseDiariaId") REFERENCES "ClaseDiaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaseActividad" ADD CONSTRAINT "ClaseActividad_juegoId_fkey" FOREIGN KEY ("juegoId") REFERENCES "Juego"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Juego" ADD CONSTRAINT "Juego_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Docente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Juego" ADD CONSTRAINT "Juego_ejeNapId_fkey" FOREIGN KEY ("ejeNapId") REFERENCES "EjeNap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_claseDiariaId_fkey" FOREIGN KEY ("claseDiariaId") REFERENCES "ClaseDiaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubrica" ADD CONSTRAINT "Rubrica_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaCriterio" ADD CONSTRAINT "RubricaCriterio_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "Rubrica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionAlumno" ADD CONSTRAINT "EvaluacionAlumno_ejeNapId_fkey" FOREIGN KEY ("ejeNapId") REFERENCES "EjeNap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionDetalle" ADD CONSTRAINT "EvaluacionDetalle_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "EvaluacionAlumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionDetalle" ADD CONSTRAINT "EvaluacionDetalle_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "RubricaCriterio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestFisico" ADD CONSTRAINT "TestFisico_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espacio" ADD CONSTRAINT "Espacio_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "Institucion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaEspacio" ADD CONSTRAINT "ReservaEspacio_espacioId_fkey" FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaEspacio" ADD CONSTRAINT "ReservaEspacio_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "Institucion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EjeNapToPlanificacion" ADD CONSTRAINT "_EjeNapToPlanificacion_A_fkey" FOREIGN KEY ("A") REFERENCES "EjeNap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EjeNapToPlanificacion" ADD CONSTRAINT "_EjeNapToPlanificacion_B_fkey" FOREIGN KEY ("B") REFERENCES "Planificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
