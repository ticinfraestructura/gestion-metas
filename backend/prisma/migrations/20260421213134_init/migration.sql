-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'USUARIO',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "telefono" TEXT,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "metas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_limite" TEXT,
    "unidades" REAL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creador_id" INTEGER NOT NULL,
    CONSTRAINT "metas_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contratistas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "telefono" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "alcances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contratistaId" INTEGER NOT NULL,
    "metaId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" TEXT NOT NULL,
    "fecha_fin" TEXT NOT NULL,
    "periodicidad" TEXT NOT NULL DEFAULT 'MENSUAL',
    "porcentaje_asignado" REAL NOT NULL DEFAULT 100,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alcances_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "contratistas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alcances_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "metas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numavance" INTEGER NOT NULL DEFAULT 1,
    "descripcion" TEXT NOT NULL,
    "fecha_presentacion" TEXT NOT NULL,
    "porcentaje_avance" REAL NOT NULL DEFAULT 0,
    "aporte_meta" REAL,
    "reg_imagen" TEXT,
    "metaId" INTEGER NOT NULL,
    "contratistaId" INTEGER NOT NULL,
    "alcanceId" INTEGER,
    "reportado_por_id" INTEGER NOT NULL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avances_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "metas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avances_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "contratistas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avances_alcanceId_fkey" FOREIGN KEY ("alcanceId") REFERENCES "alcances" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "avances_reportado_por_id_fkey" FOREIGN KEY ("reportado_por_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "metas_codigo_key" ON "metas"("codigo");

-- CreateIndex
CREATE INDEX "metas_estado_idx" ON "metas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "contratistas_codigo_key" ON "contratistas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "contratistas_identificacion_key" ON "contratistas"("identificacion");

-- CreateIndex
CREATE INDEX "alcances_contratistaId_idx" ON "alcances"("contratistaId");

-- CreateIndex
CREATE INDEX "alcances_metaId_idx" ON "alcances"("metaId");

-- CreateIndex
CREATE INDEX "avances_metaId_idx" ON "avances"("metaId");

-- CreateIndex
CREATE INDEX "avances_contratistaId_idx" ON "avances"("contratistaId");
