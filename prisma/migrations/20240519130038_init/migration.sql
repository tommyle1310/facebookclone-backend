/*
  Warnings:

  - You are about to alter the column `profilePic` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1000)` to `VarChar(191)`.
  - Added the required column `fromId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromType` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notification` ADD COLUMN `fromId` INTEGER NOT NULL,
    ADD COLUMN `fromType` ENUM('USER', 'GROUP', 'EVENT', 'POST') NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `profilePic` VARCHAR(191) NULL;
