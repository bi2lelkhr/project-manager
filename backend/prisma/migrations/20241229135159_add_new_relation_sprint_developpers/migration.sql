BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Sprint_developpers] (
    [id] NVARCHAR(1000) NOT NULL,
    [is_lead] BIT NOT NULL CONSTRAINT [Sprint_developpers_is_lead_df] DEFAULT 0,
    [userId] NVARCHAR(1000) NOT NULL,
    [sprintId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Sprint_developpers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Sprint_developpers_sprintId_userId_key] UNIQUE NONCLUSTERED ([sprintId],[userId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Sprint_developpers] ADD CONSTRAINT [Sprint_developpers_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Sprint_developpers] ADD CONSTRAINT [Sprint_developpers_sprintId_fkey] FOREIGN KEY ([sprintId]) REFERENCES [dbo].[Sprint]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
