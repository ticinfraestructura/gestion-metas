-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `contratista_id` INTEGER NULL,
    MODIFY `rol` VARCHAR(20) NOT NULL DEFAULT 'CONTRATISTA';

-- CreateIndex
CREATE INDEX `usuarios_contratista_id_idx` ON `usuarios`(`contratista_id`);

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_contratista_id_fkey` FOREIGN KEY (`contratista_id`) REFERENCES `contratistas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
