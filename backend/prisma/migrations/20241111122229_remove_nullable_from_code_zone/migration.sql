/*
  Warnings:

  - Made the column `code_zone` on table `Zone` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nom` on table `Zone` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Zone] ALTER COLUMN [code_zone] VARCHAR(10) NOT NULL;
ALTER TABLE [dbo].[Zone] ALTER COLUMN [nom] TEXT NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
