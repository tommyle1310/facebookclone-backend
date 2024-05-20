-- AlterTable
ALTER TABLE `comment` ADD COLUMN `imageUrl` LONGTEXT NULL,
    ADD COLUMN `videoUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `imagUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `group` ADD COLUMN `imageUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `message` ADD COLUMN `imageUrl` LONGTEXT NULL,
    ADD COLUMN `videoUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `post` ADD COLUMN `publicStatus` ENUM('PRIVATE', 'PUBLIC', 'FRIENDS') NOT NULL DEFAULT 'PUBLIC',
    MODIFY `imageUrl` LONGTEXT NULL,
    MODIFY `videoUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `profilePic` LONGTEXT NULL;
