BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Sprint] DROP CONSTRAINT [Sprint_projectId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_sprintId_fkey];

-- AddForeignKey
ALTER TABLE [dbo].[Sprint] ADD CONSTRAINT [Sprint_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_sprintId_fkey] FOREIGN KEY ([sprintId]) REFERENCES [dbo].[Sprint]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
