CREATE TABLE [dbo].[Accepted_Orders]
(
	[OrderId] [dbo].[ID] NOT NULL PRIMARY KEY, 
    [UserId] [dbo].[ID] NOT NULL, 
    [Moment] DATETIME NOT NULL, 
    CONSTRAINT [FK_Accepted_Orders_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Orders]([OrderId])
)
