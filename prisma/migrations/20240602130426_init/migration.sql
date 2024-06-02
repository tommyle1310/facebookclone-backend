-- AlterTable
ALTER TABLE `message` ADD COLUMN `sharedPostId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_sharedPostId_fkey` FOREIGN KEY (`sharedPostId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
