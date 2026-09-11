-- Los juegos cargados desde una actividad pueden no guardarse en el banco.
-- Los que ya existen vienen del banco, así que arrancan en true.
ALTER TABLE "Juego" ADD COLUMN "enBanco" BOOLEAN NOT NULL DEFAULT true;
