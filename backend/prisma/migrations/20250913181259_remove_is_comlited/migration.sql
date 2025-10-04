-- Drop default constraints before modifying columns
ALTER TABLE [dbo].[Sprint] DROP CONSTRAINT [Sprint_isActive_df];
ALTER TABLE [dbo].[Sprint] DROP CONSTRAINT [Sprint_isCompleted_df];
ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_status_df];
ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_isActive_df];
ALTER TABLE [dbo].[Task] DROP CONSTRAINT [Task_isCompleted_df];

-- Now drop the columns safely
ALTER TABLE [dbo].[Sprint] DROP COLUMN [isActive];
ALTER TABLE [dbo].[Sprint] DROP COLUMN [isCompleted];
ALTER TABLE [dbo].[Task] DROP COLUMN [status];
ALTER TABLE [dbo].[Task] DROP COLUMN [isActive];
ALTER TABLE [dbo].[Task] DROP COLUMN [isCompleted];
