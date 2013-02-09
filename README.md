JS2PLSql
========

A JavaScript library written in TypeScript to build PL/SQL scripts.

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
      CustomerNm VARCHAR2(30),
    	CONSTRAINT Customer_PK PRIMARY KEY (CustomerID)
    );
    
    CREATE TABLE Product(
    	ProductID NUMBER(5) NOT NULL,
    	ProductNm VARCHAR2(30),
    	CONSTRAINT Product_PK PRIMARY KEY (ProductID)
    );
    
    CREATE TABLE CustomerOrder(
    	CustomerID NUMBER(5),
    	ProductID NUMBER(5),
    	ShipDate DATE,
    	CONSTRAINT Customer_FK 
    		FOREIGN KEY (CustomerID) 
    		REFERENCES Customer(CustomerID),
    	CONSTRAINT Product_FK 
    		FOREIGN KEY (ProductID) 
    		REFERENCES Product(ProductID)
    );

