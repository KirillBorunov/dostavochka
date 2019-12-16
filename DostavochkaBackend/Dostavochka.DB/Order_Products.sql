CREATE TABLE [dbo].[Order_Products]
(
	[EntryId] [dbo].[ID] NOT NULL IDENTITY , 
    [OrderId] [dbo].[ID] NOT NULL, 
    [Description] NVARCHAR(50) NOT NULL, 
    [Count] INT NOT NULL, 
    [Unit] TINYINT NOT NULL, 
    [Budget] DECIMAL NOT NULL, 
    [ProductId] [dbo].[ID] NOT NULL, 
    PRIMARY KEY ([EntryId], [OrderId]), 
    CONSTRAINT [FK_Order_Products_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Orders]([OrderId])
)
