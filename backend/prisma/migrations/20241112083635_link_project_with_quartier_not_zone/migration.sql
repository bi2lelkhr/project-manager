/*
  Warnings:

  - You are about to drop the column `zoneId` on the `Project` table. All the data in the column will be lost.
  - Added the required column `quartierId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Project] DROP CONSTRAINT [Project_zoneId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Project] DROP COLUMN [zoneId];
ALTER TABLE [dbo].[Project] ADD [quartierId] NVARCHAR(1000) NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_quartierId_fkey] FOREIGN KEY ([quartierId]) REFERENCES [dbo].[Quartier]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
