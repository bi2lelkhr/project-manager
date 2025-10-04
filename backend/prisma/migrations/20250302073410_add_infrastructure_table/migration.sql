BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Noeud] ADD [network] TEXT;

-- CreateTable
CREATE TABLE [dbo].[Infrastructure] (
    [id] NVARCHAR(1000) NOT NULL,
    [noeudId] NVARCHAR(1000) NOT NULL,
    [network] TEXT NOT NULL,
    [port] INT NOT NULL,
    [in_out] TEXT NOT NULL,
    [protocol] TEXT NOT NULL,
    CONSTRAINT [Infrastructure_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Infrastructure] ADD CONSTRAINT [Infrastructure_noeudId_fkey] FOREIGN KEY ([noeudId]) REFERENCES [dbo].[Noeud]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
