-- AlterTable
ALTER TABLE `message` ADD COLUMN `type` ENUM('DEFAULT', 'POST_SHARE', 'GROUP_INVITE') NOT NULL DEFAULT 'DEFAULT';
