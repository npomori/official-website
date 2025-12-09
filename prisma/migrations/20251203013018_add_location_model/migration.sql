-- CreateTable
CREATE TABLE `Location` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `position` JSON NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `activities` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `hasDetail` BOOLEAN NOT NULL DEFAULT false,
    `activityDetails` TEXT NULL,
    `fieldCharacteristics` TEXT NULL,
    `access` TEXT NULL,
    `facilities` TEXT NULL,
    `schedule` VARCHAR(191) NULL,
    `requirements` TEXT NULL,
    `participationFee` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `other` TEXT NULL,
    `meetingAddress` TEXT NULL,
    `meetingTime` VARCHAR(191) NULL,
    `meetingMapUrl` TEXT NULL,
    `meetingAdditionalInfo` TEXT NULL,
    `images` JSON NULL,
    `attachments` JSON NULL,
    `upcomingDates` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'published',
    `creatorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
