-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'USUARIO',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "email_validado" BOOLEAN NOT NULL DEFAULT false,
    "token_validacion_email" TEXT,
    "fecha_token_validacion" DATETIME,
    "ultimo_login" DATETIME,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "fecha_bloqueo" DATETIME,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sesiones_usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "token_refresh" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "fecha_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" DATETIME NOT NULL,
    "fecha_cierre" DATETIME,
    CONSTRAINT "sesiones_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "logs_autenticacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER,
    "email" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "resultado" TEXT NOT NULL DEFAULT 'FALLIDO',
    "motivo" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_autenticacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_limite" DATETIME,
    "creador_id" INTEGER NOT NULL,
    CONSTRAINT "metas_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contratistas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "avances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "fecha_presentacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numavance" INTEGER NOT NULL DEFAULT 1,
    "reg_imagen" TEXT,
    "meta_id" INTEGER NOT NULL,
    "contratista_id" INTEGER NOT NULL,
    "reportado_por_id" INTEGER NOT NULL,
    CONSTRAINT "avances_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "metas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avances_contratista_id_fkey" FOREIGN KEY ("contratista_id") REFERENCES "contratistas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avances_reportado_por_id_fkey" FOREIGN KEY ("reportado_por_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_token_validacion_email_key" ON "usuarios"("token_validacion_email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_usuario_token_refresh_key" ON "sesiones_usuario"("token_refresh");

-- CreateIndex
CREATE UNIQUE INDEX "contratistas_identificacion_key" ON "contratistas"("identificacion");
