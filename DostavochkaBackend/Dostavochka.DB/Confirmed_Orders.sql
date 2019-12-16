CREATE TABLE [dbo].[Confirmed_Orders]
(
	[OrderId] [dbo].[ID] NOT NULL PRIMARY KEY, 
    [Moment] DATETIME NOT NULL, 
    [Memo] NVARCHAR(100) NOT NULL, 
    CONSTRAINT [FK_Confirmed_Orders_FinishedOrders] FOREIGN KEY ([OrderId]) REFERENCES [Finished_Orders]([OrderId])
)
