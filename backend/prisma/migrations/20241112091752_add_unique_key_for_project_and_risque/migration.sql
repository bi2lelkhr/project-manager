/*
  Warnings:

  - A unique constraint covering the columns `[projectId,risqueId]` on the table `Projects_risques` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[Projects_risques] ADD CONSTRAINT [Projects_risques_projectId_risqueId_key] UNIQUE NONCLUSTERED ([projectId], [risqueId]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
