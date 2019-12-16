CREATE TABLE [dbo].[Finished_Orders]
(
	[OrderId] [dbo].[ID] NOT NULL PRIMARY KEY, 
    [Moment] DATETIME NOT NULL, 
    [Memo] NVARCHAR(100) NOT NULL, 
    CONSTRAINT [FK_Finished_Orders_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Accepted_Orders]([OrderId])
)
