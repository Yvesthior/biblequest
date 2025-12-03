-- AlterTable
ALTER TABLE `question` MODIFY `questionText` TEXT NOT NULL,
    MODIFY `explanation` TEXT NULL,
    MODIFY `reference` TEXT NULL;

-- AlterTable
ALTER TABLE `quiz` MODIFY `description` TEXT NULL;
