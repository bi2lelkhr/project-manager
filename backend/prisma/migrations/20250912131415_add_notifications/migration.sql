BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] NVARCHAR(1000) NOT NULL,
    [message] TEXT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [isRead] BIT NOT NULL CONSTRAINT [Notification_isRead_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
