JS2PLSql
========

A JavaScript library written in TypeScript to build PL/SQL scripts. 

Here's a live <a target='_blank' href='http://jsfiddle.net/yuipcheng/AbfHB/'>fiddle</a>.

Usage:

    var tables =
        [
            new Table("Customer").SetColumns(
            [
                new NumberColumn("CustomerID", 5).PK(),
                new Varchar2Column("CustomerNm", 30)
            ]),
            new Table("Product").SetColumns(
            [
                new NumberColumn("ProductID", 5).PK(),
                new Varchar2Column("ProductNm", 30)
            ]),
            new Table("CustomerOrder").SetColumns(
            [
                new NumberColumn("CustomerID", 5).FK("Customer", "CustomerID"),
                new NumberColumn("ProductID", 5).FK("Product", "ProductID"),
                new DateColumn("ShipDate")
            ])
        ];

    var plsql = new Builder(tables).ToPLSql();
    
Output:

    CREATE TABLE Customer(
        CustomerID NUMBER(5) NOT NULL,
    	CustomerNm VARCHAR2(30)
    );
    CREATE TABLE Product(
    	ProductID NUMBER(5) NOT NULL,
    	ProductNm VARCHAR2(30)
    );
    CREATE TABLE CustomerOrder(
    	CustomerID NUMBER(5),
    	ProductID NUMBER(5),
    	ShipDate DATE
    );
    
    ALTER TABLE Customer
    	ADD CONSTRAINT Customer_PK PRIMARY KEY (CustomerID);
    ALTER TABLE Product
    	ADD CONSTRAINT Product_PK PRIMARY KEY (ProductID);
    ALTER TABLE CustomerOrder
    	ADD Customer_FK 
    		FOREIGN KEY (CustomerID) 
    		REFERENCES Customer(CustomerID);
    ALTER TABLE CustomerOrder
    	ADD Product_FK 
    		FOREIGN KEY (ProductID) 
    		REFERENCES Product(ProductID);

