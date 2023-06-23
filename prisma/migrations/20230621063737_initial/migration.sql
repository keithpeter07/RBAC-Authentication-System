-- DropForeignKey
ALTER TABLE `AuthUser` DROP FOREIGN KEY `AuthUser_levelId_fkey`;

-- DropForeignKey
ALTER TABLE `AuthUser` DROP FOREIGN KEY `AuthUser_roleId_fkey`;

-- AddForeignKey
ALTER TABLE `AuthUser` ADD CONSTRAINT `AuthUser_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `AuthRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthUser` ADD CONSTRAINT `AuthUser_levelId_fkey` FOREIGN KEY (`levelId`) REFERENCES `AuthUserLevel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
