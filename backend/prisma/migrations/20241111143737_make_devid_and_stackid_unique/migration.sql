/*
  Warnings:

  - A unique constraint covering the columns `[userId,devStackId]` on the table `Developpers_stack` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[Developpers_stack] ADD CONSTRAINT [Developpers_stack_userId_devStackId_key] UNIQUE NONCLUSTERED ([userId], [devStackId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
