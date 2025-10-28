-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordResetExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(255) NULL;
