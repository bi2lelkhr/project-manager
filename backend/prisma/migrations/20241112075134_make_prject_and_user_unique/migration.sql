/*
  Warnings:

  - A unique constraint covering the columns `[projectId,userId]` on the table `Project_developpers` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[Project_developpers] ADD CONSTRAINT [Project_developpers_projectId_userId_key] UNIQUE NONCLUSTERED ([projectId], [userId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
