-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('MEMORY', 'TAG', 'POST_LIKE', 'IS_LIVESTREAMING', 'FRIEND_ACCEPT', 'GROUP_POST', 'POST_COMMENT', 'DEFAULT', 'FRIEND_REQUEST', 'GROUP_INVITE', 'EVENT_INVITE', 'SUBSCRIBE_POST') NOT NULL;
