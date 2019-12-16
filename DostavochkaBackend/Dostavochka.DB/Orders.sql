CREATE TABLE [dbo].[Orders]
(
	[OrderId] [dbo].[ID] NOT NULL PRIMARY KEY IDENTITY, 
    [OwnerId] [dbo].[ID] NOT NULL, 
    [Memo] NVARCHAR(250) NOT NULL, 
    [Budget] DECIMAL NOT NULL, 
    [Tip] DECIMAL NOT NULL, 
    [Address] NVARCHAR(150) NOT NULL, 
    [Status] TINYINT NOT NULL DEFAULT 0, 
    [Moment] DATETIME NOT NULL
)
