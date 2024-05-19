/*
  Warnings:

  - The values [GROUP,FRIENDREQUEST,INVITE,SUBSCRIBE] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('MEMORY', 'TAG', 'IS_LIVESTREAMING', 'FRIEND_ACCEPT', 'GROUP_POST', 'DEFAULT', 'FRIEND_REQUEST', 'GROUP_INVITE', 'EVENT_INVITE', 'SUBSCRIBE_POST') NOT NULL;
