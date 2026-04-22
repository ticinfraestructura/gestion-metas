-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(200) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol` VARCHAR(20) NOT NULL DEFAULT 'USUARIO',
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    `telefono` VARCHAR(50) NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NULL,
    `nombre` VARCHAR(300) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    `fecha_limite` VARCHAR(20) NULL,
    `unidades` DOUBLE NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creador_id` INTEGER NOT NULL,

    UNIQUE INDEX `metas_codigo_key`(`codigo`),
    INDEX `metas_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratistas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NULL,
    `nombre` VARCHAR(300) NOT NULL,
    `identificacion` VARCHAR(50) NOT NULL,
    `contacto` VARCHAR(200) NOT NULL,
    `telefono` VARCHAR(50) NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'activo',
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_actualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contratistas_codigo_key`(`codigo`),
    UNIQUE INDEX `contratistas_identificacion_key`(`identificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alcances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contratistaId` INTEGER NOT NULL,
    `metaId` INTEGER NOT NULL,
    `descripcion` TEXT NOT NULL,
    `fecha_inicio` VARCHAR(20) NOT NULL,
    `fecha_fin` VARCHAR(20) NOT NULL,
    `periodicidad` VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    `porcentaje_asignado` DOUBLE NOT NULL DEFAULT 100,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alcances_contratistaId_idx`(`contratistaId`),
    INDEX `alcances_metaId_idx`(`metaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numavance` INTEGER NOT NULL DEFAULT 1,
    `descripcion` TEXT NOT NULL,
    `fecha_presentacion` VARCHAR(30) NOT NULL,
    `porcentaje_avance` DOUBLE NOT NULL DEFAULT 0,
    `aporte_meta` DOUBLE NULL,
    `reg_imagen` VARCHAR(500) NULL,
    `metaId` INTEGER NOT NULL,
    `contratistaId` INTEGER NOT NULL,
    `alcanceId` INTEGER NULL,
    `reportado_por_id` INTEGER NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avances_metaId_idx`(`metaId`),
    INDEX `avances_contratistaId_idx`(`contratistaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `metas` ADD CONSTRAINT `metas_creador_id_fkey` FOREIGN KEY (`creador_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alcances` ADD CONSTRAINT `alcances_contratistaId_fkey` FOREIGN KEY (`contratistaId`) REFERENCES `contratistas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alcances` ADD CONSTRAINT `alcances_metaId_fkey` FOREIGN KEY (`metaId`) REFERENCES `metas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avances` ADD CONSTRAINT `avances_metaId_fkey` FOREIGN KEY (`metaId`) REFERENCES `metas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avances` ADD CONSTRAINT `avances_contratistaId_fkey` FOREIGN KEY (`contratistaId`) REFERENCES `contratistas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avances` ADD CONSTRAINT `avances_alcanceId_fkey` FOREIGN KEY (`alcanceId`) REFERENCES `alcances`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avances` ADD CONSTRAINT `avances_reportado_por_id_fkey` FOREIGN KEY (`reportado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
