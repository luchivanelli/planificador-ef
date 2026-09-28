-- Saca de la base la tabla `Indicadores`, que era del sistema de evaluación
-- anterior: desde `20260818200000_rubricas_por_clase` los indicadores viven en
-- `Rubrica` + `RubricaIndicador`, colgando de la clase y no sueltos. La tabla
-- vieja quedó en la base pero nunca salió del esquema de Prisma, así que cada
-- `migrate diff` proponía borrarla y ensuciaba cualquier migración generada.
--
-- Se borra vacía (0 filas) y sin nadie apuntándole: su única restricción es la
-- que ella misma tiene contra `ClaseDiaria`, y cae junto con la tabla.
ALTER TABLE "Indicadores" DROP CONSTRAINT "Indicadores_claseDiariaID_fkey";

DROP TABLE "Indicadores";
