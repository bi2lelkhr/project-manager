BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Deploiment] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] TEXT NOT NULL,
    [link] TEXT,
    [is_alive] TEXT,
    [projectId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Deploiment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Deploy_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [deploimentId] NVARCHAR(1000) NOT NULL,
    [commit] TEXT NOT NULL,
    [date_dep] DATETIME2 NOT NULL,
    [is_success] BIT NOT NULL,
    CONSTRAINT [Deploy_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Quartier] (
    [id] NVARCHAR(1000) NOT NULL,
    [code_quartier] VARCHAR(10) NOT NULL,
    [nom] TEXT NOT NULL,
    [description] TEXT,
    [zoneId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Quartier_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Sprint] (
    [id] NVARCHAR(1000) NOT NULL,
    [sprint_name] TEXT NOT NULL,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2,
    [projectId] NVARCHAR(1000),
    CONSTRAINT [Sprint_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [job_title] NVARCHAR(1000) NOT NULL,
    [is_developper] BIT NOT NULL CONSTRAINT [User_is_developper_df] DEFAULT 1,
    [is_admin] BIT NOT NULL CONSTRAINT [User_is_admin_df] DEFAULT 0,
    [password] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Zone] (
    [id] NVARCHAR(1000) NOT NULL,
    [code_zone] VARCHAR(10),
    [nom] TEXT,
    [description] TEXT,
    CONSTRAINT [Zone_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Dev_stack] (
    [id] NVARCHAR(1000) NOT NULL,
    [framework] TEXT NOT NULL,
    [programming_language] TEXT NOT NULL,
    [version] TEXT,
    CONSTRAINT [Dev_stack_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Developpers_stack] (
    [id] NVARCHAR(1000) NOT NULL,
    [devStackId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Developpers_stack_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Noeud] (
    [id] NVARCHAR(1000) NOT NULL,
    [designation] TEXT NOT NULL,
    [description] TEXT,
    [repository_link] TEXT,
    [typeNoeudId] NVARCHAR(1000) NOT NULL,
    [devStackId] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Noeud_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] TEXT,
    [description] TEXT,
    [zoneId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Task] (
    [id] NVARCHAR(1000) NOT NULL,
    [designation] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2,
    [timeline] DATETIME2 NOT NULL,
    [developerId] NVARCHAR(1000),
    [sprintId] NVARCHAR(1000),
    [status] INT NOT NULL CONSTRAINT [Task_status_df] DEFAULT 0,
    CONSTRAINT [Task_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Project_developpers] (
    [id] NVARCHAR(1000) NOT NULL,
    [is_lead] BIT NOT NULL CONSTRAINT [Project_developpers_is_lead_df] DEFAULT 0,
    [userId] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Project_developpers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Projects_risques] (
    [id] NVARCHAR(1000) NOT NULL,
    [projectId] NVARCHAR(1000) NOT NULL,
    [risqueId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Projects_risques_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Risque] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [severity] INT NOT NULL CONSTRAINT [Risque_severity_df] DEFAULT 1,
    CONSTRAINT [Risque_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Type_noeud] (
    [id] NVARCHAR(1000) NOT NULL,
    [designation] TEXT,
    [description] TEXT,
    CONSTRAINT [Type_noeud_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Deploiment] ADD CONSTRAINT [Deploiment_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Deploy_history] ADD CONSTRAINT [Deploy_history_deploimentId_fkey] FOREIGN KEY ([deploimentId]) REFERENCES [dbo].[Deploiment]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Quartier] ADD CONSTRAINT [Quartier_zoneId_fkey] FOREIGN KEY ([zoneId]) REFERENCES [dbo].[Zone]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Sprint] ADD CONSTRAINT [Sprint_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Developpers_stack] ADD CONSTRAINT [Developpers_stack_devStackId_fkey] FOREIGN KEY ([devStackId]) REFERENCES [dbo].[Dev_stack]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Developpers_stack] ADD CONSTRAINT [Developpers_stack_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Noeud] ADD CONSTRAINT [Noeud_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Noeud] ADD CONSTRAINT [Noeud_devStackId_fkey] FOREIGN KEY ([devStackId]) REFERENCES [dbo].[Dev_stack]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Noeud] ADD CONSTRAINT [Noeud_typeNoeudId_fkey] FOREIGN KEY ([typeNoeudId]) REFERENCES [dbo].[Type_noeud]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_zoneId_fkey] FOREIGN KEY ([zoneId]) REFERENCES [dbo].[Zone]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_developerId_fkey] FOREIGN KEY ([developerId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [Task_sprintId_fkey] FOREIGN KEY ([sprintId]) REFERENCES [dbo].[Sprint]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Project_developpers] ADD CONSTRAINT [Project_developpers_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Project_developpers] ADD CONSTRAINT [Project_developpers_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Projects_risques] ADD CONSTRAINT [Projects_risques_risqueId_fkey] FOREIGN KEY ([risqueId]) REFERENCES [dbo].[Risque]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Projects_risques] ADD CONSTRAINT [Projects_risques_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
